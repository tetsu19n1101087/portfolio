/**
 * 全ページ共通の背景（液体グラデーション）の入口。three.js には依存しない。
 * 初期表示を遅らせないよう、ページの読み込みと手すきを待ってから描画側を動的 import する。
 * 使えない環境では何もせず、背面の CSS グラデーションがそのまま見える。
 */
import { motionPreference } from '@/scripts/motion/preferences';
import { createStageInput, isStageSceneName, stageScenes } from './presets';

const IDLE_TIMEOUT_MS = 2000;
/** ポインタが止まってから、渦を弱め始めるまでの時間 */
const POINTER_REST_MS = 1200;

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

const prefersSaveData = () => (navigator as NavigatorWithConnection).connection?.saveData === true;

const whenLoaded = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    window.addEventListener('load', () => resolve(), { once: true });
  });

const whenIdle = () =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
      return;
    }
    setTimeout(resolve, 1);
  });

export const initStage = async (root: HTMLElement) => {
  const canvas = root.querySelector<HTMLCanvasElement>('.js-stageCanvas');
  // データ節約を求められているときは、three.js を読み込まない
  if (!canvas || prefersSaveData()) {
    return;
  }

  const input = createStageInput();

  // data-stage を持つ要素。ページ遷移のたびに集め直す
  let zones: HTMLElement[] = [];
  const collectZones = () => {
    zones = [...document.querySelectorAll<HTMLElement>('[data-stage]')];
  };

  // 画面の中央にかかっている要素の場面を採用する。入れ子のときは内側（後ろにある方）を優先する
  const readPage = () => {
    const center = window.innerHeight / 2;
    let name: string | undefined;
    for (const zone of zones) {
      const rect = zone.getBoundingClientRect();
      if (rect.top <= center && rect.bottom >= center) {
        name = zone.dataset.stage;
      }
    }
    input.scene = isStageSceneName(name) ? stageScenes[name] : stageScenes.default;
    input.scroll = window.scrollY / Math.max(window.innerHeight, 1);
  };

  let restTimer = 0;
  window.addEventListener(
    'pointermove',
    (event) => {
      input.pointer[0] = event.clientX / Math.max(window.innerWidth, 1);
      input.pointer[1] = event.clientY / Math.max(window.innerHeight, 1);
      input.pointerActive = 1;
      window.clearTimeout(restTimer);
      restTimer = window.setTimeout(() => {
        input.pointerActive = 0;
      }, POINTER_REST_MS);
    },
    { passive: true },
  );

  await whenLoaded();
  await whenIdle();

  const { createStageRenderer } = await import('./renderer');
  const renderer = await createStageRenderer({
    canvas,
    input,
    onBeforeFrame: readPage,
    onFirstFrame: () => root.classList.add('is-ready'),
    onLost: () => root.classList.remove('is-ready'),
    // ?renderer=webgl2 を付けて開くと、WebGPU が使える環境でもフォールバック側の描画を確認できる
    forceWebGL: new URLSearchParams(window.location.search).get('renderer') === 'webgl2',
  });
  if (!renderer) {
    return;
  }

  collectZones();

  // 動かしてよいときはループを回す。止めるときは最後の絵を残す
  const sync = () => {
    if (motionPreference.allowed) {
      renderer.start();
      return;
    }
    renderer.stop();
    // 「動きを減らす」設定のとき、および一度も描いていないときは、静止した 1 フレームを描く
    if (motionPreference.reduced || !root.classList.contains('is-ready')) {
      renderer.renderStill();
    }
  };
  sync();
  motionPreference.subscribe(sync);

  document.addEventListener('astro:page-load', () => {
    collectZones();
    // 止まっている間も、ページが替わったら場面だけは合わせる
    if (!motionPreference.allowed) {
      renderer.renderStill();
    }
  });
};
