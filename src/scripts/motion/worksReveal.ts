import { gsap, ScrollTrigger, MOTION_QUERY, hasMotionReady } from '@/scripts/motion/core';

const CLIP_HIDDEN = 'inset(100% 0% 0% 0%)';
const CLIP_SHOWN = 'inset(0% 0% 0% 0%)';
const STAGGER = 0.12;

/**
 * 作品カードの外側（article / li）を clip-path で下から開き、中の画像を 1.15 → 1 に戻す。
 * .c-WorkCard 本体は CSS transition を持つので触らない
 */
export const initWorksReveal = (root: HTMLElement) => {
  const items = gsap.utils.toArray<HTMLElement>('.js-revealItem', root);

  if (items.length === 0 || !hasMotionReady()) {
    return;
  }

  // reduced-motion へ切り替わったら表示済みとみなし、戻しても再生しない
  let enabled = true;

  gsap.matchMedia().add(MOTION_QUERY, (context) => {
    if (!enabled) {
      return;
    }

    gsap.set(items, { clipPath: CLIP_HIDDEN });
    gsap.set(gsap.utils.toArray('.js-revealMedia', root), { scale: 1.15 });

    ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => {
        context.add(() => {
          batch.forEach((item, index) => {
            const vars = { duration: 1, ease: 'expo.out', delay: index * STAGGER };

            gsap.to(item, { ...vars, clipPath: CLIP_SHOWN, clearProps: 'clipPath' });
            gsap.to(item.querySelectorAll('.js-revealMedia'), { ...vars, scale: 1, clearProps: 'transform' });
          });
        });
      },
    });

    return () => {
      enabled = false;
    };
  });
};
