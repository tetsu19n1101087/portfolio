import { SplitText } from 'gsap/SplitText';
import { gsap, MOTION_QUERY, hasMotionReady } from '@/scripts/motion/core';

gsap.registerPlugin(SplitText);

/**
 * 作品詳細の登場。タイトルを単語ごとに表示し、日付・タグ・カルーセルを時間差でフェードアップする。
 * カルーセルは embla の計測に影響しないよう、外側のラッパーを opacity と y だけで動かす
 */
export const initWorkDetailIntro = (root: HTMLElement) => {
  const title = root.querySelector<HTMLElement>('.js-introTitle');
  const items = gsap.utils.toArray<HTMLElement>('.js-introItem', root);

  if (!title || !hasMotionReady()) {
    return;
  }

  // reduced-motion へ切り替わったら表示済みとみなし、戻しても再生しない
  let enabled = true;

  gsap.matchMedia().add(MOTION_QUERY, () => {
    if (!enabled) {
      return;
    }

    const split = SplitText.create(title, { type: 'words' });

    gsap
      .timeline({
        defaults: { duration: 0.9, ease: 'expo.out' },
        onComplete: () => split.revert(),
      })
      .from(split.words, { y: 16, opacity: 0, stagger: 0.06 })
      .from(items, { y: 16, opacity: 0, stagger: 0.1, clearProps: 'transform,opacity' }, 0.15);

    return () => {
      enabled = false;
    };
  });
};
