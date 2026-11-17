/**
 * ページ遷移の演出。背景（WebGL）が画面を覆い、次のページで晴れる。
 *
 * 1. リンクを押すと、押した位置から背景の波が広がり、本文は薄れて消える（その裏で次のページを読み込む）
 * 2. 覆いきって読み込みも済んだら、Astro がページの中身を入れ替える
 * 3. 波が引き、新しい本文が現れる
 *
 * 背景が使えない環境では、本文が薄れて現れるだけになる。
 * 動かしてはいけないとき（停止ボタン・「動きを減らす」設定）は何もせず、すぐに切り替わる。
 */
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { gsap } from 'gsap';
import { stageInput } from '@/scripts/stage';
import { motionPreference } from './preferences';

const TRANSITION_CLASS = 'is-pageTransition';
const COVER_SECONDS = 0.55;
const CLEAR_SECONDS = 0.9;
/** 覆ったまま次のページが現れないとき、元の表示へ戻すまでの時間 */
const STUCK_TIMEOUT_MS = 10000;

let transitioning = false;
/** 何回目の遷移か。古い遷移の後始末が、新しい遷移の状態を壊さないようにするための番号 */
let generation = 0;
let stuckTimer = 0;

const findMain = () => document.querySelector<HTMLElement>('.l-Main');

// 押した位置を覆いの起点にする。キーボード操作や「戻る」のときは画面の中央から広げる
let lastPress: { x: number; y: number; time: number } | null = null;
document.addEventListener(
  'pointerdown',
  (event) => {
    lastPress = {
      x: event.clientX / Math.max(window.innerWidth, 1),
      y: event.clientY / Math.max(window.innerHeight, 1),
      time: performance.now(),
    };
  },
  { capture: true, passive: true },
);

/**
 * 遷移が最後まで進まなかったときに、本文と背景を元の表示へ戻す。
 * 覆っている最中にページ内リンクへ移動した、遷移先が Astro の管理外で読み込み直しになった、などで起こる
 */
const recover = () => {
  transitioning = false;
  window.clearTimeout(stuckTimer);
  gsap.killTweensOf(stageInput);
  gsap.to(stageInput, { flood: 0, duration: 0.4, ease: 'power2.out' });
  document.documentElement.classList.remove(TRANSITION_CLASS);
  const main = findMain();
  if (main) {
    gsap.killTweensOf(main);
    gsap.set(main, { clearProps: 'opacity,transform' });
  }
};

const cover = () =>
  new Promise<void>((resolve) => {
    const main = findMain();
    gsap.killTweensOf(stageInput);
    gsap.to(stageInput, { flood: 1, duration: COVER_SECONDS, ease: 'power2.in' });
    if (main) {
      // 前の遷移で本文を現している途中なら、その動きを止めてから消す
      gsap.killTweensOf(main);
      gsap.to(main, { opacity: 0, y: -16, duration: COVER_SECONDS * 0.8, ease: 'power2.in' });
    }
    gsap.delayedCall(COVER_SECONDS, resolve);
  });

document.addEventListener('astro:before-preparation', (rawEvent) => {
  if (!motionPreference.allowed) {
    return;
  }
  const event = rawEvent as TransitionBeforePreparationEvent;
  const { loader } = event;
  const pressedNow = lastPress !== null && performance.now() - lastPress.time < 1000;
  stageInput.floodOrigin[0] = pressedNow && lastPress ? lastPress.x : 0.5;
  stageInput.floodOrigin[1] = pressedNow && lastPress ? lastPress.y : 0.5;

  generation += 1;
  const current = generation;
  transitioning = true;
  document.documentElement.classList.add(TRANSITION_CLASS);

  // この遷移が打ち切られたとき。すぐ次の遷移が始まるなら、そちらが状態を引き継ぐ。
  // 始まらなかった（ページ内リンクへ移動した、など）ときだけ、元の表示へ戻す
  event.signal.addEventListener(
    'abort',
    () => {
      window.setTimeout(() => {
        if (transitioning && generation === current) {
          recover();
        }
      }, 0);
    },
    { once: true },
  );
  window.clearTimeout(stuckTimer);
  stuckTimer = window.setTimeout(() => {
    if (transitioning && generation === current) {
      recover();
    }
  }, STUCK_TIMEOUT_MS);

  // 次のページの読み込みと、覆う演出の両方が済むまで、中身の入れ替えを待たせる
  event.loader = async () => {
    await Promise.all([loader(), cover()]);
  };
});

// 中身が入れ替わった直後（まだ描かれていない）。新しい本文を隠しておく。
// <html> の属性は新しいページのものに置き換わるので、クラスも付け直す
document.addEventListener('astro:after-swap', () => {
  if (!transitioning) {
    return;
  }
  document.documentElement.classList.add(TRANSITION_CLASS);
  const main = findMain();
  if (main) {
    gsap.set(main, { opacity: 0, y: 16 });
  }
});

// 新しいページのスタイルとスクリプトが揃った。覆いを晴らして本文を出す
document.addEventListener('astro:page-load', () => {
  if (!transitioning) {
    return;
  }
  transitioning = false;
  window.clearTimeout(stuckTimer);
  gsap.killTweensOf(stageInput);
  gsap.to(stageInput, { flood: 0, duration: CLEAR_SECONDS, ease: 'power2.out' });
  // 止めていた出現アニメーション（見出しの文字など）を、本文と一緒に始める
  document.documentElement.classList.remove(TRANSITION_CLASS);
  const main = findMain();
  if (main) {
    gsap.to(main, { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: 'power2.out', clearProps: 'opacity,transform' });
  }
});

// 覆った状態のままブラウザに保存されたページへ「戻る」で帰ってきたとき
window.addEventListener('pageshow', (event) => {
  if (event.persisted && (transitioning || stageInput.flood > 0)) {
    recover();
  }
});
