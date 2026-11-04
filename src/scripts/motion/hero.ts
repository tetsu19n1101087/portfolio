import { gsap, isRevealed, markRevealed, withMotion } from './core';
import { animateCharsIn } from './split';

/**
 * トップの Hero 登場。タイトルを 1 文字ずつせり上げ → サブタイトルをフェードアップ → スクロール案内を表示。
 * タイトルは LCP 要素なので、開始遅延は付けず全体を約 1 秒に収める。
 */
export const initHeroIntro = (root: HTMLElement) => {
  const title = root.querySelector<HTMLElement>('.js-heroTitle');
  const subtitle = root.querySelector<HTMLElement>('.js-heroSubtitle');
  const scrollHint = root.querySelector<HTMLElement>('.js-heroScrollHint');

  if (!title || !subtitle || !scrollHint) {
    return;
  }

  withMotion(() => {
    // 表示済み（OS の動きを減らす設定を切り替えて戻した場合など）は再生し直さない
    if (isRevealed(title)) {
      markRevealed([subtitle, scrollHint]);
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => markRevealed([subtitle, scrollHint]),
    });

    tl.add(
      animateCharsIn(title, {
        duration: 0.55,
        onComplete: () => markRevealed(title),
      }),
    )
      .fromTo(subtitle, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, 0.45)
      .fromTo(scrollHint, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.65);
  });
};
