import { gsap, ScrollTrigger, isRevealed, markRevealed, withMotion } from './core';
import { animateCharsIn } from './split';

/**
 * 'top 85%'（要素の上端が画面の 85% の位置に来たとき）と同じ発火位置。
 * ページ末尾の要素はそこまで上がりきらないため、スクロールの最大値の手前に収めて必ず発火させる。
 * clamp() は発火位置を 0 以上にも丸めてしまい、読み込み時点で画面内にある要素が発火しないので使わない。
 */
const START = (self: ScrollTrigger) => {
  const top = self.trigger ? self.trigger.getBoundingClientRect().top + window.scrollY : 0;

  return Math.min(top - window.innerHeight * 0.85, ScrollTrigger.maxScroll(window) - 1);
};

/**
 * ページ共通のスクロール表示。root（.l-Main）配下の次のフックを対象にする。
 * - .js-reveal / .js-revealGroup > * : 下から 24px 浮き上がりながらフェードイン
 * - .js-splitHeading : 1 文字ずつマスクの下からせり上げ
 */
export const initReveal = (root: HTMLElement) => {
  withMotion(() => {
    const items = gsap.utils
      .toArray<HTMLElement>(root.querySelectorAll('.js-reveal, .js-revealGroup > *'))
      .filter((el) => !isRevealed(el));

    if (items.length > 0) {
      gsap.set(items, { y: 24 });

      ScrollTrigger.batch(items, {
        start: START,
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            stagger: 0.08,
            onComplete: () => markRevealed(batch),
          });
        },
      });
    }

    gsap.utils
      .toArray<HTMLElement>(root.querySelectorAll('.js-splitHeading'))
      .filter((el) => !isRevealed(el))
      .forEach((heading) => {
        ScrollTrigger.create({
          trigger: heading,
          start: START,
          once: true,
          onEnter: () => {
            animateCharsIn(heading, {
              onComplete: () => markRevealed(heading),
            });
          },
        });
      });
  });
};
