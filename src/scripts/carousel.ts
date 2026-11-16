import EmblaCarousel from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { motionPreference } from '@/scripts/motion/preferences';

// クライアントサイド遷移ではこのスクリプトは 1 回しか実行されないため、
// ページが替わるたびに作り直し、離れる前に片付ける
const initialized = new WeakSet<HTMLElement>();
let cleanups: Array<() => void> = [];

const setup = () => {
  document.querySelectorAll<HTMLElement>('.js-carousel').forEach((carousel) => {
    const carouselView = carousel.querySelector<HTMLElement>('.js-carouselView');

    if (!carouselView || initialized.has(carousel)) {
      return;
    }
    initialized.add(carousel);

    const embla = EmblaCarousel(
      carouselView,
      {
        loop: true,
      },
      [Autoplay({ playOnInit: false })],
    );

    const prev = carousel.querySelector<HTMLButtonElement>('.btn-prev');
    const next = carousel.querySelector<HTMLButtonElement>('.btn-next');

    prev?.addEventListener('click', () => {
      embla.scrollPrev();
    });

    next?.addEventListener('click', () => {
      embla.scrollNext();
    });

    // 自動再生は、動きを出してよいときだけ行う（停止ボタン・「動きを減らす」設定に従う）
    const syncAutoplay = () => {
      const autoplay = embla.plugins().autoplay;
      // 画像が 1 枚のときプラグインは初期化されず、play() を呼ぶと例外になる
      if (!autoplay || embla.scrollSnapList().length <= 1) {
        return;
      }
      if (motionPreference.allowed) {
        autoplay.play();
      } else {
        autoplay.stop();
      }
    };
    syncAutoplay();
    const unsubscribe = motionPreference.subscribe(syncAutoplay);

    cleanups.push(() => {
      unsubscribe();
      embla.destroy();
    });
  });
};

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
});
// 遷移で初めてこのスクリプトが読み込まれた場合、astro:page-load に間に合わないことがある
setup();
