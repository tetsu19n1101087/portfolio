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

let transitioning = false;

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

const cover = () =>
  new Promise<void>((resolve) => {
    const main = findMain();
    gsap.killTweensOf(stageInput);
    gsap.to(stageInput, { flood: 1, duration: COVER_SECONDS, ease: 'power2.in' });
    if (!main) {
      gsap.delayedCall(COVER_SECONDS, resolve);
      return;
    }
    gsap.to(main, { opacity: 0, y: -16, duration: COVER_SECONDS * 0.8, ease: 'power2.in' });
    gsap.delayedCall(COVER_SECONDS, resolve);
  });

document.addEventListener('astro:before-preparation', (event) => {
  if (!motionPreference.allowed) {
    return;
  }
  const { loader } = event as TransitionBeforePreparationEvent;
  const pressedNow = lastPress !== null && performance.now() - lastPress.time < 1000;
  stageInput.floodOrigin[0] = pressedNow && lastPress ? lastPress.x : 0.5;
  stageInput.floodOrigin[1] = pressedNow && lastPress ? lastPress.y : 0.5;

  transitioning = true;
  document.documentElement.classList.add(TRANSITION_CLASS);
  // 次のページの読み込みと、覆う演出の両方が済むまで、中身の入れ替えを待たせる
  (event as TransitionBeforePreparationEvent).loader = async () => {
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
  gsap.killTweensOf(stageInput);
  gsap.to(stageInput, { flood: 0, duration: CLEAR_SECONDS, ease: 'power2.out' });
  // 止めていた出現アニメーション（見出しの文字など）を、本文と一緒に始める
  document.documentElement.classList.remove(TRANSITION_CLASS);
  const main = findMain();
  if (main) {
    gsap.to(main, { opacity: 1, y: 0, duration: 0.6, delay: 0.1, ease: 'power2.out', clearProps: 'opacity,transform' });
  }
});
