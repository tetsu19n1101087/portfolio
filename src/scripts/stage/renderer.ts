/**
 * 背景の描画本体。three.js に依存するのはこのファイルとその import 先だけにして、
 * 入口（index.ts）から動的 import で遅れて読み込む。
 */
import { screenUV } from 'three/tsl';
import { Color, PerspectiveCamera, Scene, WebGPURenderer } from 'three/webgpu';
import { createGradient, withGrain } from './background';
import type { StageInput, StageScene } from './presets';
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
}

export interface StageRenderer {
  /** 動かし始める */
  start(): void;
  /** 止める。最後に描いた絵は残る */
  stop(): void;
  /** 1 フレームだけ描く。場面の値は途中経過を挟まず目標に合わせる */
  renderStill(): void;
  dispose(): void;
}

/** 値が目標に近づく速さ。大きいほど速い */
const FOLLOW = {
  scene: 1.4,
  pointer: 5,
  pointerForce: 2.2,
  scroll: 6,
};

/** 動きを止めた状態で初めて描くときの時刻。0 だと模様が偏るため、ずらす */
const STILL_TIME = 24;

/** 1 フレームに進める時間の上限。タブを離れて戻った直後に絵が飛ばないようにする */
const MAX_DELTA = 0.1;

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
    renderer = new WebGPURenderer({ canvas, antialias: true, alpha: false });
    await renderer.init();
  } catch {
    return null;
  }

  const uniforms = createStageUniforms();
  const scene = new Scene();
  scene.backgroundNode = withGrain(uniforms)(createGradient(uniforms)(screenUV));

  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 6;

  // タッチ端末は GPU が弱いことが多いので、描画解像度の上限を下げる
  const maxPixelRatio = window.matchMedia('(pointer: coarse)').matches ? 1.25 : 1.5;
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
    uniforms.focus.value.x += (target.focus[0] - uniforms.focus.value.x) * sceneRate;
    uniforms.focus.value.y += (target.focus[1] - uniforms.focus.value.y) * sceneRate;
    flow += (target.flow - flow) * sceneRate;

    const pointerRate = snap ? 1 : follow(FOLLOW.pointer, delta);
    uniforms.pointer.value.x += (input.pointer[0] - uniforms.pointer.value.x) * pointerRate;
    uniforms.pointer.value.y += (input.pointer[1] - uniforms.pointer.value.y) * pointerRate;
    // 止めた絵には渦を残さない
    const force = snap ? 0 : input.pointerActive;
    uniforms.pointerForce.value += (force - uniforms.pointerForce.value) * (snap ? 1 : follow(FOLLOW.pointerForce, delta));
    uniforms.scroll.value += (input.scroll - uniforms.scroll.value) * (snap ? 1 : follow(FOLLOW.scroll, delta));

    uniforms.time.value += delta * flow;
  };

  let disposed = false;
  let running = false;
  let firstFrameDone = false;
  let lastTime = 0;
  let slowFrames = 0;
  let countedFrames = 0;

  const draw = () => {
    renderer.render(scene, camera);
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
    dispose,
  };
};
