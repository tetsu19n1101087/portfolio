import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// プラグイン登録と既定値はここ 1 か所にまとめる
gsap.registerPlugin(ScrollTrigger, SplitText);

gsap.defaults({
  duration: 0.9,
  ease: 'expo.out',
});

// Web フォント適用で行の高さが変わると発火位置がずれるため、読み込み後に計算し直す
document.fonts.ready.then(() => {
  ScrollTrigger.refresh();
});

/** モーションを再生してよい条件。gsap.matchMedia() に渡して OS 設定の切り替えに追従させる */
export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

const root = document.documentElement;

/**
 * BaseLayout の inline スクリプトが付けた is-motionReady が残っていれば、モーション開始を宣言する。
 * 保険のタイマーで外れた後（スクリプトの読み込みが遅れた場合）は、表示済みの内容を隠し直さないよう何もしない。
 */
const isMotionAvailable = root.classList.contains('is-motionReady');

if (isMotionAvailable) {
  root.classList.add('is-motionStarted');
}

/** matchMedia の条件を満たすあいだだけ setup を実行する。条件が外れると setup 内のアニメーションは自動で元に戻る */
export const withMotion = (setup: () => void) => {
  if (!isMotionAvailable) {
    return;
  }

  gsap.matchMedia().add(MOTION_QUERY, setup);
};

/** 表示し終えた要素に印を付け、初期非表示の CSS とインラインスタイルを外す */
export const markRevealed = (targets: Element | Element[]) => {
  const elements = Array.isArray(targets) ? targets : [targets];

  elements.forEach((el) => el.classList.add('is-revealed'));
  gsap.set(elements, { clearProps: 'opacity,transform' });
};

export const isRevealed = (el: Element) => el.classList.contains('is-revealed');

export { gsap, ScrollTrigger, SplitText };
