import { gsap, FINE_POINTER_MOTION_QUERY } from '@/scripts/motion/core';

const MAX_X = 6;
const MAX_Y = 3;

/**
 * ポインタに数 px 吸い寄せる。対象自身の CSS hover の transform と競合しないよう、内側の .js-magneticInner を動かす
 */
export const initMagnetic = (target: HTMLElement) => {
  const inner = target.querySelector<HTMLElement>('.js-magneticInner');

  if (!inner) {
    return;
  }

  gsap.matchMedia().add(FINE_POINTER_MOTION_QUERY, () => {
    const xTo = gsap.quickTo(inner, 'x', { duration: 0.6, ease: 'expo.out' });
    const yTo = gsap.quickTo(inner, 'y', { duration: 0.6, ease: 'expo.out' });

    const handleMove = (event: PointerEvent) => {
      const rect = target.getBoundingClientRect();
      // 中心からのずれを -1〜1 に正規化する
      const ratioX = (event.clientX - rect.left) / rect.width - 0.5;
      const ratioY = (event.clientY - rect.top) / rect.height - 0.5;

      xTo(gsap.utils.clamp(-1, 1, ratioX * 2) * MAX_X);
      yTo(gsap.utils.clamp(-1, 1, ratioY * 2) * MAX_Y);
    };

    const handleLeave = () => {
      xTo(0);
      yTo(0);
    };

    target.addEventListener('pointermove', handleMove);
    target.addEventListener('pointerleave', handleLeave);

    return () => {
      target.removeEventListener('pointermove', handleMove);
      target.removeEventListener('pointerleave', handleLeave);
    };
  });
};
