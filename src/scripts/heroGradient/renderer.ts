import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Mesh,
  OrthographicCamera,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
} from 'three';
import vertexShader from './gradient.vert.glsl?raw';
import fragmentShader from './gradient.frag.glsl?raw';
import { getHeroGradientTicker, heroGradientState, onHeroGradientTickerChange, type FrameCallback } from './state';

const MAX_PIXEL_RATIO = 1;
/** reduced-motion で描く 1 フレームの時刻（固定シード） */
const STATIC_TIME = 7.3;
/** 描画負荷の計測に使うフレーム数と、描画倍率を下げるしきい値 */
const PROBE_FRAMES = 60;
const SLOW_FRAME_MS = 20;
const SCALE_STEP = 0.75;
const MIN_SCALE = 0.5;
const TOUCH_FRAME_MS = 1000 / 30;
const MAX_DELTA_SECONDS = 0.1;
const POINTER_EASING = 4;
const TOUCH_SWIRL_STRENGTH = 0.55;
const MINT = '#ccfbf1';
const FALLBACK_BASE = '#ffffff';
const FALLBACK_TEAL = '#0ea5a4';

export interface HeroGradientOptions {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  context: WebGL2RenderingContext;
  copyTargets: HTMLElement[];
  /** abort されたら、初期化の途中でも破棄する */
  signal: AbortSignal;
  /** コンテキスト喪失などで内部から破棄されたときに呼ぶ */
  onDispose?: () => void;
}

export interface HeroGradientRenderer {
  /** ユーザー操作による一時停止。止めた位置の絵を残す */
  setPaused(paused: boolean): void;
  dispose(): void;
}

const readColor = (element: HTMLElement, property: string, fallback: string) => {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  return new Color(value || fallback);
};

/** 全画面を覆う三角形 1 枚 */
const createFullscreenTriangle = () => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  return geometry;
};

export const createHeroGradient = async ({
  root,
  canvas,
  context,
  copyTargets,
  signal: abortSignal,
  onDispose,
}: HeroGradientOptions): Promise<HeroGradientRenderer | null> => {
  const renderer = new WebGLRenderer({
    canvas,
    context,
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector3(0.5, 0.5, 0) },
    uProgress: { value: heroGradientState.progress },
    uIntensity: { value: heroGradientState.intensity },
    uMask: { value: new Vector4(0.5, 0.5, 0, 0) },
    uColorBase: { value: readColor(root, '--color-bg', FALLBACK_BASE) },
    uColorMint: { value: new Color(MINT) },
    uColorTeal: { value: readColor(root, '--color-accent', FALLBACK_TEAL) },
  };

  const geometry = createFullscreenTriangle();
  const material = new ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new OrthographicCamera();

  const listeners = new AbortController();
  const { signal } = listeners;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(hover: none) and (pointer: coarse)');

  let ready = false;
  let disposed = false;
  let running = false;
  let paused = false;
  let inView = true;
  let pageVisible = document.visibilityState === 'visible';
  let elapsed = 0;
  let lastTick: number | null = null;
  let lastRender = 0;
  let renderScale = 1;
  let probing = true;
  let probeTotal = 0;
  let probeCount = 0;
  let cssWidth = 0;
  let cssHeight = 0;
  const pointer = { x: 0.5, y: 0.5, strength: 0 };
  let pointerClient: { x: number; y: number } | null = null;

  const draw = () => {
    renderer.render(scene, camera);
  };

  const applySize = () => {
    if (cssWidth === 0 || cssHeight === 0) {
      return;
    }
    renderer.setSize(
      Math.max(1, Math.round(cssWidth * renderScale)),
      Math.max(1, Math.round(cssHeight * renderScale)),
      false,
    );
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
  };

  /** h1 とサブタイトルの文字が載っている範囲を、canvas 内の 0〜1 座標で uniform に入れる */
  const measureMask = () => {
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width === 0 || canvasRect.height === 0) {
      return;
    }
    const range = document.createRange();
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    copyTargets.forEach((target) => {
      range.selectNodeContents(target);
      const rect = range.getBoundingClientRect();
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    });
    if (!Number.isFinite(left)) {
      return;
    }
    uniforms.uMask.value.set(
      ((left + right) / 2 - canvasRect.left) / canvasRect.width,
      1 - ((top + bottom) / 2 - canvasRect.top) / canvasRect.height,
      (right - left) / 2 / canvasRect.width,
      (bottom - top) / 2 / canvasRect.height,
    );
  };

  const syncState = () => {
    uniforms.uProgress.value = heroGradientState.progress;
    uniforms.uIntensity.value = heroGradientState.intensity;
  };

  const drawStatic = () => {
    uniforms.uTime.value = STATIC_TIME;
    uniforms.uPointer.value.set(0.5, 0.5, 0);
    syncState();
    draw();
  };

  /**
   * 最初の 60 フレームの平均が重ければ描画倍率を一段下げ、また 60 フレーム測る。
   * 倍率を下げて canvas の中身が消えたときは true を返す
   */
  const probe = (delta: number) => {
    if (!probing) {
      return false;
    }
    probeTotal += delta;
    probeCount += 1;
    if (probeCount < PROBE_FRAMES) {
      return false;
    }
    const slow = probeTotal / probeCount > SLOW_FRAME_MS;
    probeTotal = 0;
    probeCount = 0;
    if (slow && renderScale > MIN_SCALE) {
      renderScale = Math.max(MIN_SCALE, renderScale * SCALE_STEP);
      applySize();
      return true;
    }
    probing = false;
    return false;
  };

  const updatePointer = (dt: number) => {
    let targetX = pointer.x;
    let targetY = pointer.y;
    let targetStrength = 0;

    if (coarsePointer.matches) {
      // タッチ端末はポインタがないので、ゆっくり自動で揺らす
      targetX = 0.5 + 0.28 * Math.cos(elapsed * 0.21);
      targetY = 0.5 + 0.22 * Math.sin(elapsed * 0.17);
      targetStrength = TOUCH_SWIRL_STRENGTH;
    } else if (pointerClient) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetX = (pointerClient.x - rect.left) / rect.width;
        targetY = 1 - (pointerClient.y - rect.top) / rect.height;
        targetStrength = 1;
      }
    }

    const easing = 1 - Math.exp(-dt * POINTER_EASING);
    pointer.x += (targetX - pointer.x) * easing;
    pointer.y += (targetY - pointer.y) * easing;
    pointer.strength += (targetStrength - pointer.strength) * easing;
    uniforms.uPointer.value.set(pointer.x, pointer.y, pointer.strength * heroGradientState.pointerStrength);
  };

  const tick: FrameCallback = () => {
    const now = performance.now();
    if (lastTick === null) {
      lastTick = now;
      lastRender = now;
    } else {
      const resized = probe(now - lastTick);
      lastTick = now;
      // 30fps に間引くが、倍率を下げた直後は空の canvas を見せないよう必ず描く
      if (!resized && coarsePointer.matches && now - lastRender < TOUCH_FRAME_MS - 1) {
        return;
      }
    }
    const dt = Math.min((now - lastRender) / 1000, MAX_DELTA_SECONDS);
    lastRender = now;
    elapsed += dt;
    uniforms.uTime.value = elapsed;
    updatePointer(dt);
    syncState();
    draw();
  };

  const start = () => {
    running = true;
    lastTick = null;
    // 停止明けの 1 フレーム目は間隔が長いので、計測をやり直す
    probeTotal = 0;
    probeCount = 0;
    getHeroGradientTicker().add(tick);
  };

  const stop = () => {
    running = false;
    getHeroGradientTicker().remove(tick);
  };

  const update = () => {
    if (!ready || disposed) {
      return;
    }
    const shouldRun = !paused && !reducedMotion.matches && inView && pageVisible;
    if (shouldRun && !running) {
      start();
    } else if (!shouldRun && running) {
      stop();
    }
  };

  /** ループが止まっているときに、今の uniform で 1 フレーム描き直す */
  const redrawIfIdle = () => {
    if (!ready || disposed || running) {
      return;
    }
    if (reducedMotion.matches) {
      drawStatic();
    } else {
      draw();
    }
  };

  const handleMotionPreference = () => {
    update();
    // reduce に切り替わったら、止めた位置ではなく固定シードの 1 フレームに描き直す
    if (ready && !disposed && reducedMotion.matches) {
      drawStatic();
    }
  };

  const unsubscribeTicker = onHeroGradientTickerChange((next, previous) => {
    if (running) {
      previous.remove(tick);
      next.add(tick);
    }
  });

  const intersectionObserver = new IntersectionObserver((entries) => {
    inView = entries.some((entry) => entry.isIntersecting);
    update();
  });
  intersectionObserver.observe(canvas);

  const resizeObserver = new ResizeObserver(() => {
    measureMask();
    const resized = canvas.clientWidth !== cssWidth || canvas.clientHeight !== cssHeight;
    if (resized) {
      cssWidth = canvas.clientWidth;
      cssHeight = canvas.clientHeight;
      applySize();
    }
    // シェーダーの非同期コンパイルが終わるまでは描かない
    if (!ready || disposed) {
      return;
    }
    if (resized && running) {
      // setSize で canvas の中身が消えるので、同じフレームのうちに描き直す
      draw();
    } else {
      redrawIfIdle();
    }
  });
  resizeObserver.observe(canvas);
  copyTargets.forEach((target) => resizeObserver.observe(target));

  const dispose = (contextLost = false) => {
    if (disposed) {
      return;
    }
    disposed = true;
    stop();
    listeners.abort();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    unsubscribeTicker();
    canvas.classList.remove('is-ready');
    geometry.dispose();
    material.dispose();
    // コンテキストも手放す（ページ内で作り直したときに溜まらないように）
    if (!contextLost) {
      renderer.forceContextLoss();
    }
    renderer.dispose();
    onDispose?.();
  };

  // Web フォントの読み込みで文字の範囲が変わるので測り直す
  document.fonts.ready.then(() => {
    if (!disposed) {
      measureMask();
      redrawIfIdle();
    }
  });

  document.addEventListener(
    'visibilitychange',
    () => {
      pageVisible = document.visibilityState === 'visible';
      update();
    },
    { signal },
  );
  reducedMotion.addEventListener('change', handleMotionPreference, { signal });
  root.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'mouse') {
        pointerClient = { x: event.clientX, y: event.clientY };
      }
    },
    { passive: true, signal },
  );
  root.addEventListener(
    'pointerleave',
    () => {
      pointerClient = null;
    },
    { signal },
  );
  // コンテキストを失ったら止めて、背面の CSS グラデーションに戻す
  canvas.addEventListener('webglcontextlost', () => dispose(true), { signal });
  abortSignal.addEventListener('abort', () => dispose(), { once: true, signal });

  cssWidth = canvas.clientWidth;
  cssHeight = canvas.clientHeight;
  applySize();
  measureMask();

  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    dispose();
    return null;
  }
  if (disposed || abortSignal.aborted) {
    dispose();
    return null;
  }

  if (reducedMotion.matches) {
    drawStatic();
  } else {
    syncState();
    draw();
  }
  canvas.classList.add('is-ready');
  ready = true;
  update();

  return {
    setPaused(value) {
      paused = value;
      update();
    },
    dispose: () => dispose(),
  };
};
