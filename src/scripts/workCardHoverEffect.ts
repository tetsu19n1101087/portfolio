import {
  Camera,
  CanvasTexture,
  Mesh,
  NoBlending,
  PlaneGeometry,
  SRGBColorSpace,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';

const ENTER_DURATION = 0.8;
const LEAVE_DURATION = 0.5;
const MAX_PIXEL_RATIO = 2;

const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uCover;
  uniform vec2 uPointer;
  uniform float uAspect;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  vec2 coverUv(vec2 uv) {
    return (uv - 0.5) * uCover + 0.5;
  }

  void main() {
    vec2 offset = vUv - uPointer;
    offset.x *= uAspect;
    float dist = length(offset);
    vec2 dir = dist > 0.0001 ? offset / dist : vec2(0.0);
    dir.x /= uAspect;

    float wave = sin(dist * 30.0 - uTime * 4.0) * exp(-dist * 3.0) * uProgress;
    vec2 uv = (vUv - 0.5) / (1.0 + 0.03 * uProgress) + 0.5;
    uv += dir * wave * 0.005;

    vec2 shift = dir * (0.002 + abs(wave) * 0.002) * uProgress;
    vec4 base = texture2D(uTexture, coverUv(uv));
    float r = texture2D(uTexture, coverUv(uv + shift)).r;
    float b = texture2D(uTexture, coverUv(uv - shift)).b;

    gl_FragColor = vec4(r, base.g, b, base.a);
    #include <colorspace_fragment>
    gl_FragColor.rgb *= gl_FragColor.a;
  }
`;

type Options = {
  onContextLost: () => void;
};

// expo.out
const easeOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

export function createWorkCardHoverEffect(
  canvas: HTMLCanvasElement,
  context: WebGL2RenderingContext,
  { onContextLost }: Options,
) {
  const renderer = new WebGLRenderer({
    canvas,
    context,
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));

  const uniforms = {
    uTexture: { value: null as CanvasTexture | null },
    uCover: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector2(0.5, 0.5) },
    uAspect: { value: 1 },
    uProgress: { value: 0 },
    uTime: { value: 0 },
  };
  const geometry = new PlaneGeometry(1, 1);
  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  const camera = new Camera();

  const textures = new Map<HTMLImageElement, CanvasTexture>();
  const failedImages = new WeakSet<HTMLImageElement>();
  const pointerTarget = new Vector2(0.5, 0.5);

  let media: HTMLElement | null = null;
  let image: HTMLImageElement | null = null;
  let isHovered = false;
  let progressFrom = 0;
  let progressTo = 0;
  let tweenStart = 0;
  let frameId = 0;
  let lastTime = 0;
  let isLost = false;

  const resizeObserver = new ResizeObserver(() => {
    if (media && image) {
      resize(media, image);
    }
  });

  canvas.addEventListener('webglcontextlost', () => {
    isLost = true;
    hide();
    canvas.remove();
    onContextLost();
  });

  function createTexture(target: HTMLElement, img: HTMLImageElement) {
    const pixelRatio = renderer.getPixelRatio();
    const scale = Math.min(
      1,
      Math.max(target.clientWidth / img.naturalWidth, target.clientHeight / img.naturalHeight) *
        pixelRatio *
        1.05,
    );
    const source = document.createElement('canvas');
    source.width = Math.max(1, Math.round(img.naturalWidth * scale));
    source.height = Math.max(1, Math.round(img.naturalHeight * scale));
    source.getContext('2d')?.drawImage(img, 0, 0, source.width, source.height);

    const texture = new CanvasTexture(source);
    texture.colorSpace = SRGBColorSpace;
    // CORS が通っていない画像はここで SecurityError になる
    renderer.initTexture(texture);
    return texture;
  }

  function resize(target: HTMLElement, img: HTMLImageElement) {
    const width = target.clientWidth;
    const height = target.clientHeight;
    const planeAspect = width / height;
    const imageAspect = img.naturalWidth / img.naturalHeight;

    renderer.setSize(width, height, false);
    uniforms.uAspect.value = planeAspect;
    uniforms.uCover.value.set(
      planeAspect > imageAspect ? 1 : planeAspect / imageAspect,
      planeAspect > imageAspect ? imageAspect / planeAspect : 1,
    );
  }

  function setPointer(clientX: number, clientY: number) {
    if (!media) {
      return;
    }

    const rect = media.getBoundingClientRect();
    pointerTarget.set((clientX - rect.left) / rect.width, 1 - (clientY - rect.top) / rect.height);
  }

  function tweenTo(value: number, now: number) {
    progressFrom = uniforms.uProgress.value;
    progressTo = value;
    tweenStart = now;
  }

  function hide() {
    cancelAnimationFrame(frameId);
    frameId = 0;
    resizeObserver.disconnect();
    media?.classList.remove('is-glActive');
    media = null;
    image = null;
    isHovered = false;
    uniforms.uProgress.value = 0;
  }

  function tick(now: number) {
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    const duration = progressTo > progressFrom ? ENTER_DURATION : LEAVE_DURATION;
    const t = Math.min((now - tweenStart) / 1000 / duration, 1);
    uniforms.uProgress.value = progressFrom + (progressTo - progressFrom) * easeOut(t);
    uniforms.uTime.value += delta;
    uniforms.uPointer.value.lerp(pointerTarget, 1 - Math.exp(-delta * 10));

    renderer.render(mesh, camera);

    if (!isHovered && t >= 1) {
      hide();
      return;
    }

    frameId = requestAnimationFrame(tick);
  }

  async function enter(target: HTMLElement, img: HTMLImageElement, clientX: number, clientY: number) {
    if (isLost || failedImages.has(img)) {
      return;
    }

    if (media !== target) {
      hide();
    }

    media = target;
    image = img;
    isHovered = true;
    setPointer(clientX, clientY);

    if (!img.complete || img.naturalWidth === 0) {
      try {
        await img.decode();
      } catch {
        failedImages.add(img);
        hide();
        return;
      }

      // 読み込み待ちの間にポインタが離れた・別のカードへ移った
      if (media !== target || !isHovered) {
        return;
      }
    }

    let texture = textures.get(img);

    if (!texture) {
      try {
        texture = createTexture(target, img);
        textures.set(img, texture);
      } catch {
        failedImages.add(img);
        hide();
        return;
      }
    }

    const now = performance.now();

    if (!frameId) {
      uniforms.uTexture.value = texture;
      uniforms.uPointer.value.copy(pointerTarget);
      target.append(canvas);
      resize(target, img);
      resizeObserver.observe(target);
      // 1 フレーム描いてから DOM の img と差し替える
      renderer.render(mesh, camera);
      target.classList.add('is-glActive');
      lastTime = now;
      frameId = requestAnimationFrame(tick);
    }

    tweenTo(1, now);
  }

  function move(clientX: number, clientY: number) {
    setPointer(clientX, clientY);
  }

  function leave(target: HTMLElement) {
    if (media !== target || !isHovered) {
      return;
    }

    isHovered = false;
    tweenTo(0, performance.now());
  }

  return { enter, move, leave, reset: hide };
}

export type WorkCardHoverEffect = ReturnType<typeof createWorkCardHoverEffect>;
