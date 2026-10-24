import { gsap, MOTION_QUERY } from '@/scripts/motion/core';

/**
 * Hero のスクロールアウト。スクロール量に合わせてコピーを少し上へ動かして薄くし、scrollHint を消す。
 * スクロール 0 の位置では何も変わらないので、h1 の初期表示（LCP）には影響しない
 */
export const initHeroScroll = (root: HTMLElement) => {
  const copy = root.querySelector<HTMLElement>('.js-heroCopy');
  const scrollHint = root.querySelector<HTMLElement>('.js-heroScrollHint');

  if (!copy || !scrollHint) {
    return;
  }

  gsap.matchMedia().add(MOTION_QUERY, () => {
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root,
          start: 0,
          end: 'bottom top',
          scrub: 0.4,
        },
      })
      .to(copy, { y: -24, opacity: 0.3, duration: 1 }, 0)
      .to(scrollHint, { opacity: 0, duration: 0.25 }, 0);
  });
};
