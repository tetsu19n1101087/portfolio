/**
 * スクロールに連動する DOM のアニメーション（GSAP + ScrollTrigger）。
 * 慣性スクロールは使わず、ブラウザ標準のスクロールにそのまま連動させる。
 *
 * - data-reveal="scroll"   画面に入ったときに現れる。文字分割した見出しは 1 文字ずつ、それ以外はまとまりごと
 * - data-scroll-fade       属するセクションが画面から出ていくのに合わせて、上へ流れながら薄れる
 *
 * 動かしてよいとき（motionPreference.allowed）だけ組み立て、止めるときは元の表示へ戻す。
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motionPreference } from './preferences';

gsap.registerPlugin(ScrollTrigger);

let context: gsap.Context | null = null;

// すでに見えている要素は対象にしない。いったん隠して出し直すと、ちらついて見えるため
const isBelowFold = (element: Element) => element.getBoundingClientRect().top > window.innerHeight * 0.95;

const build = () => {
  context = gsap.context(() => {
    const blocks: HTMLElement[] = [];

    document.querySelectorAll<HTMLElement>("[data-reveal='scroll']").forEach((target) => {
      if (!isBelowFold(target)) {
        return;
      }
      const chars = target.querySelectorAll('.c-SplitText__char');
      if (chars.length === 0) {
        blocks.push(target);
        return;
      }
      gsap.from(chars, {
        opacity: 0,
        yPercent: 55,
        rotate: 8,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.035,
        scrollTrigger: { trigger: target, start: 'top 88%', once: true },
      });
    });

    if (blocks.length > 0) {
      gsap.set(blocks, { opacity: 0, y: 32 });
      // 同時に画面へ入った要素は、少しずつずらして順に出す
      ScrollTrigger.batch(blocks, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, overwrite: true });
        },
      });
    }

    document.querySelectorAll<HTMLElement>('[data-scroll-fade]').forEach((target) => {
      const section = target.closest('section') ?? target;
      gsap.to(target, {
        opacity: 0,
        y: () => window.innerHeight * -0.12,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 30%', scrub: true, invalidateOnRefresh: true },
      });
    });
  });
};

const teardown = () => {
  context?.revert();
  context = null;
};

const sync = () => {
  teardown();
  if (motionPreference.allowed) {
    build();
  }
};

// クライアントサイド遷移ではこのスクリプトは 1 回しか実行されないため、ページが替わるたびに組み立て直す
document.addEventListener('astro:page-load', sync);
document.addEventListener('astro:before-swap', teardown);
motionPreference.subscribe(sync);
