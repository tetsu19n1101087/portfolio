/**
 * 背景の描画本体。three.js に依存するのはこのファイルとその import 先だけにして、
 * 入口（index.ts）から動的 import で遅れて読み込む。
 */
import { screenUV } from 'three/tsl';
import { Color, PerspectiveCamera, Scene, WebGPURenderer } from 'three/webgpu';
import { createGradient, withGrain } from './background';
import { createCarouselDistortionLayer } from './carouselDistortion';
import type { CarouselDistortionLayer, CarouselDistortionOptions } from './carouselDistortion';
import { createImageRevealLayer } from './imageReveal';
import type { ImageRevealLayer, ImageRevealOptions } from './imageReveal';
import { createOrb } from './orb';
import type { OrbPose, StageInput, StageScene } from './presets';
import { createStageUniforms } from './uniforms';

export interface StageRendererOptions {
  canvas: HTMLCanvasElement;
  input: StageInput;
  /** 毎フレーム、描画の直前に呼ぶ。input を最新にするために使う */
  onBeforeFrame?: () => void;
  /** 最初の 1 フレームを描き終えたときに呼ぶ */
  onFirstFrame?: () => void;
  /** GPU との接続が切れて描けなくなったときに呼ぶ */
  onLost?: () => void;
  /** WebGPU が使える環境でも WebGL2 で描く。フォールバックの見た目を確認するためのもの */
  forceWebGL?: boolean;
}

export interface StageRenderer {
  /** 動かし始める */
  start(): void;
  /** 止める。最後に描いた絵は残る */
  stop(): void;
  /** 1 フレームだけ描く。場面の値は途中経過を挟まず目標に合わせる */
  renderStill(): void;
  /**
   * 画像が溶け出すように現れる演出を、渡した canvas に描く。
   * 使えない環境（WebGL2 に切り替わった場合など）では null を返す。呼び出し側は CSS の出現に切り替える
   */
  createImageReveal(options: ImageRevealOptions): Promise<ImageReveal | null>;
  /**
   * カルーセルが動いている間のゆがみを、渡した canvas に描く。
   * 使えない環境では null を返す。呼び出し側は演出なしで動かす
   */
  createCarouselDistortion(options: CarouselDistortionOptions): CarouselDistortion | null;
  dispose(): void;
}

/** 描画側の内部用メソッド（render）を除いた、呼び出し側へ渡す操作 */
export type CarouselDistortion = Omit<CarouselDistortionLayer, 'render'>;

export interface ImageReveal {
  /** 0 で何も見えず、1 で画像がすべて見える */
  setProgress(value: number): void;
  dispose(): void;
}

/** 値が目標に近づく速さ。大きいほど速い */
const FOLLOW = {
  scene: 1.4,
  orb: 2.2,
  pointer: 5,
  pointerForce: 2.2,
  scroll: 6,
};

/** 動きを止めた状態で初めて描くときの時刻。0 だと模様が偏るため、ずらす */
const STILL_TIME = 24;

/** 1 フレームに進める時間の上限。タブを離れて戻った直後に絵が飛ばないようにする */
const MAX_DELTA = 0.1;

/** これより縦長の画面では、球体に縦長用の位置（orbNarrow）を使う */
const NARROW_ASPECT = 0.85;

/** カメラの画角（度）と、原点からの距離 */
const CAMERA_FOV = 35;
const CAMERA_DISTANCE = 6;
/** 原点を通る平面で、画面の上端が来る高さ */
const VIEW_HALF_HEIGHT = Math.tan((CAMERA_FOV * Math.PI) / 360) * CAMERA_DISTANCE;

/** ポインタに引かれて球体がずれる量（画面の半分を 1 とする） */
const ORB_POINTER_PULL = 0.04;

/** 描画解像度の倍率を下げるかどうかを判定する間隔（フレーム数）と基準 */
const QUALITY_WINDOW = 90;
const SLOW_FRAME_SECONDS = 1 / 42;
const QUALITY_STEPS = [1, 0.75, 0.5];

const follow = (rate: number, delta: number) => 1 - Math.exp(-rate * delta);

export const createStageRenderer = async (options: StageRendererOptions): Promise<StageRenderer | null> => {
  const { canvas, input } = options;

  let renderer: WebGPURenderer;
  try {
    // WebGPU が使えない環境では、three.js が自動で WebGL2 に切り替える
    renderer = new WebGPURenderer({ canvas, antialias: true, alpha: false, forceWebGL: options.forceWebGL === true });
    await renderer.init();
  } catch {
    return null;
  }

  const uniforms = createStageUniforms();
  const gradient = createGradient(uniforms);
  const grain = withGrain(uniforms);
  const scene = new Scene();
  scene.backgroundNode = grain(gradient(screenUV));

  const orb = createOrb(uniforms, gradient, grain);
  scene.add(orb.mesh);

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 50);
  camera.position.z = CAMERA_DISTANCE;

  // 描画解像度の上限。画面の広いデスクトップは画素数が多いので低めにする。
  // タッチ端末は画面が小さいぶん高めにして、球体の縁のギザギザを抑える
  const maxPixelRatio = window.matchMedia('(pointer: coarse)').matches ? 2 : 1.5;
  let qualityStep = 0;

  const applySize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width === 0 || height === 0) {
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio) * QUALITY_STEPS[qualityStep]);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.aspect.value = width / height;
    return true;
  };

  // 場面の色は、文字列の解析を毎フレーム繰り返さないよう、場面が替わったときだけ作り直す
  let currentScene: StageScene | null = null;
  const targetColorA = new Color();
  const targetColorB = new Color();
  let flow = 0;
  // 球体のいまの位置と大きさ。最初のフレームで目標に合わせる
  const pose: OrbPose = { x: 0, y: 0, size: 0 };
  let poseReady = false;

  const update = (delta: number, snap: boolean) => {
    options.onBeforeFrame?.();

    const target = input.scene;
    if (target !== currentScene) {
      currentScene = target;
      targetColorA.set(target.colorA);
      targetColorB.set(target.colorB);
    }

    const sceneRate = snap ? 1 : follow(FOLLOW.scene, delta);
    uniforms.colorA.value.lerp(targetColorA, sceneRate);
    uniforms.colorB.value.lerp(targetColorB, sceneRate);
    uniforms.intensity.value += (target.intensity - uniforms.intensity.value) * sceneRate;
    flow += (target.flow - flow) * sceneRate;

    const aspect = uniforms.aspect.value;
    const targetPose = aspect < NARROW_ASPECT ? target.orbNarrow : target.orb;
    const poseRate = snap || !poseReady ? 1 : follow(FOLLOW.orb, delta);
    poseReady = true;
    pose.x += (targetPose.x - pose.x) * poseRate;
    pose.y += (targetPose.y - pose.y) * poseRate;
    pose.size += (targetPose.size - pose.size) * poseRate;
    // 背景の色は球体の位置で最も明るくする（画面左上を [0, 0] とする座標へ直す）
    uniforms.focus.value.set((pose.x + 1) / 2, (1 - pose.y) / 2);

    const pointerRate = snap ? 1 : follow(FOLLOW.pointer, delta);
    uniforms.pointer.value.x += (input.pointer[0] - uniforms.pointer.value.x) * pointerRate;
    uniforms.pointer.value.y += (input.pointer[1] - uniforms.pointer.value.y) * pointerRate;
    // 止めた絵には渦を残さない
    const force = snap ? 0 : input.pointerActive;
    uniforms.pointerForce.value += (force - uniforms.pointerForce.value) * (snap ? 1 : follow(FOLLOW.pointerForce, delta));
    uniforms.scroll.value += (input.scroll - uniforms.scroll.value) * (snap ? 1 : follow(FOLLOW.scroll, delta));

    // 球体: 画面上の位置（-1〜1）を、カメラから見た 3D 空間の位置へ直す
    const pointerX = uniforms.pointer.value.x * 2 - 1;
    const pointerY = 1 - uniforms.pointer.value.y * 2;
    const pull = uniforms.pointerForce.value * ORB_POINTER_PULL;
    const orbX = pose.x + (pointerX - pose.x) * pull;
    const orbY = pose.y + (pointerY - pose.y) * pull;
    orb.mesh.position.set(orbX * VIEW_HALF_HEIGHT * aspect, orbY * VIEW_HALF_HEIGHT, 0);
    orb.mesh.scale.setScalar(Math.max(pose.size * 2 * VIEW_HALF_HEIGHT, 0.0001));

    // ポインタが球体に近いほど、その側を強くへこませる。距離は球体の半径を 1 として測る
    const radius = Math.max(pose.size * 2, 0.0001);
    const towardX = ((pointerX - orbX) * aspect) / radius;
    const towardY = (pointerY - orbY) / radius;
    const distance = Math.hypot(towardX, towardY);
    uniforms.orbPointer.value.set(towardX, towardY, 0.9).normalize();
    uniforms.orbDent.value = uniforms.pointerForce.value * Math.exp(-distance * distance * 0.35);

    uniforms.time.value += delta * flow;
  };

  // 背景とは別の canvas に描く層。1 つのレンダラーで複数の canvas に描けるのは WebGPU のときだけ
  const supportsLayers = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true;
  const mainTarget = renderer.getCanvasTarget();
  const layers = new Set<ImageRevealLayer | CarouselDistortionLayer>();

  let disposed = false;
  let running = false;
  let firstFrameDone = false;
  let lastTime = 0;
  let slowFrames = 0;
  let countedFrames = 0;

  const draw = () => {
    renderer.render(scene, camera);
    if (layers.size > 0) {
      layers.forEach((layer) => layer.render(renderer));
      renderer.setCanvasTarget(mainTarget);
    }
    if (!firstFrameDone) {
      firstFrameDone = true;
      options.onFirstFrame?.();
    }
  };

  // 遅いフレームが続いたら描画解像度を一段下げる。上げ直しはしない（上下を繰り返すとちらつくため）
  const watchQuality = (delta: number) => {
    countedFrames += 1;
    if (delta > SLOW_FRAME_SECONDS) {
      slowFrames += 1;
    }
    if (countedFrames < QUALITY_WINDOW) {
      return;
    }
    if (slowFrames > QUALITY_WINDOW / 2 && qualityStep < QUALITY_STEPS.length - 1) {
      qualityStep += 1;
      applySize();
    }
    countedFrames = 0;
    slowFrames = 0;
  };

  const loop = (time: number) => {
    const delta = lastTime === 0 ? 0 : Math.min((time - lastTime) / 1000, MAX_DELTA);
    lastTime = time;
    update(delta, false);
    draw();
    if (delta > 0) {
      watchQuality(delta);
    }
  };

  const renderStill = () => {
    if (disposed) {
      return;
    }
    if (uniforms.time.value === 0) {
      uniforms.time.value = STILL_TIME;
    }
    update(0, true);
    draw();
  };

  const resizeObserver = new ResizeObserver(() => {
    if (!applySize() || running) {
      return;
    }
    renderStill();
  });
  resizeObserver.observe(canvas);
  applySize();

  const stop = () => {
    if (!running) {
      return;
    }
    running = false;
    void renderer.setAnimationLoop(null);
  };

  const dispose = () => {
    if (disposed) {
      return;
    }
    stop();
    disposed = true;
    resizeObserver.disconnect();
    layers.forEach((layer) => layer.dispose());
    layers.clear();
    orb.dispose();
    void renderer.dispose();
  };

  renderer.onDeviceLost = () => {
    dispose();
    options.onLost?.();
  };

  return {
    start() {
      if (running || disposed) {
        return;
      }
      running = true;
      lastTime = 0;
      countedFrames = 0;
      slowFrames = 0;
      void renderer.setAnimationLoop(loop);
    },
    stop,
    renderStill,
    async createImageReveal(layerOptions) {
      // ループが止まっているときは描かれないので、作らない
      if (!supportsLayers || disposed || !running) {
        return null;
      }
      let layer: ImageRevealLayer;
      try {
        layer = await createImageRevealLayer(layerOptions);
      } catch (error) {
        // 画像を読み取れなかった場合など。呼び出し側は CSS の出現に切り替える
        if (import.meta.env.DEV) {
          console.warn('[stage] 画像の溶け出し演出を用意できなかった', error);
        }
        return null;
      }
      if (disposed) {
        layer.dispose();
        return null;
      }
      layers.add(layer);
      return {
        setProgress: (value) => layer.setProgress(value),
        dispose() {
          if (layers.delete(layer)) {
            layer.dispose();
          }
        },
      };
    },
    createCarouselDistortion(layerOptions) {
      if (!supportsLayers || disposed || !running) {
        return null;
      }
      const layer = createCarouselDistortionLayer(layerOptions);
      layers.add(layer);
      return {
        resize: layer.resize,
        setSlideImage: layer.setSlideImage,
        hasSlide: layer.hasSlide,
        setFrame: layer.setFrame,
        dispose() {
          if (layers.delete(layer)) {
            layer.dispose();
          }
        },
      };
    },
    dispose,
  };
};
