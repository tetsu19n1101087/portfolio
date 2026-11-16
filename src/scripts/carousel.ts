import EmblaCarousel from 'embla-carousel';
import type { EmblaCarouselType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { gsap } from 'gsap';
import { motionPreference } from '@/scripts/motion/preferences';
import { getStageRenderer } from '@/scripts/stage';
import type { CarouselDistortion } from '@/scripts/stage/renderer';

/** Embla の速さ（1/60 秒あたりの移動量）を、表示領域の幅 何枚分/秒 に直したうえで、この値で割って -1〜1 にする */
const FULL_SPEED = 2.5;
/** 止まったとみなす速さ。これを下回ったら、演出用の canvas から元の画像へ戻す */
const REST_SPEED = 0.004;

/**
 * 動いている間だけ、速さに応じて画像をゆがめる（WebGPU のときだけ）。
 * 表示領域に重ねた canvas に描き、その間は元の画像を透明にする。戻り値で片付ける
 */
const setupDistortion = (view: HTMLElement, embla: EmblaCarouselType) => {
  const canvas = view.querySelector<HTMLCanvasElement>('.js-carouselCanvas');
  if (!canvas) {
    return () => {};
  }

  const slides = embla.slideNodes().map((node) => ({ node, image: node.querySelector<HTMLImageElement>('img') }));
  let layer: CarouselDistortion | null = null;
  let disposed = false;
  let active = false;
  let settled = true;
  let smoothed = 0;
  let warmup = 0;
  // 表示領域の左端・幅・高さ。動き始めと大きさが変わったときにだけ読む
  let viewLeft = 0;
  let viewWidth = 1;
  let viewHeight = 1;
  const measureView = () => {
    const rect = view.getBoundingClientRect();
    viewLeft = rect.left;
    viewWidth = Math.max(rect.width, 1);
    viewHeight = Math.max(rect.height, 1);
  };

  // 背景の描画側は遅れて読み込まれるので、初めて動いたときに用意する
  const ensureLayer = () => {
    if (layer || disposed) {
      return layer;
    }
    const created =
      getStageRenderer()?.createCarouselDistortion({
        canvas,
        surfaceColor: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim() || '#0f172a',
      }) ?? null;
    if (!created) {
      return null;
    }
    layer = created;
    slides.forEach(({ image }, index) => {
      if (!image) {
        return;
      }
      const add = () => void created.setSlideImage(index, image).catch(() => {});
      if (image.complete) {
        add();
      } else {
        image.addEventListener('load', add, { once: true });
      }
    });
    return layer;
  };

  const deactivate = () => {
    if (!active) {
      return;
    }
    active = false;
    smoothed = 0;
    gsap.ticker.remove(frame);
    view.classList.remove('is-distorting');
  };

  function frame() {
    if (!layer) {
      return;
    }
    const visible = [];
    for (const [index, { node, image }] of slides.entries()) {
      const left = (node.getBoundingClientRect().left - viewLeft) / viewWidth;
      if (left <= -1 || left >= 1 || !image) {
        continue;
      }
      // 見えているスライドのテクスチャがまだ無いときは、演出をやめて元の画像を見せる
      if (!layer.hasSlide(index)) {
        deactivate();
        return;
      }
      visible.push({ index, left, height: image.clientHeight / viewHeight });
    }

    const speed = ((embla.internalEngine().scrollBody.velocity() / viewWidth) * 60) / FULL_SPEED;
    smoothed += (Math.max(-1, Math.min(1, speed)) - smoothed) * 0.2;
    layer.setFrame(visible.slice(0, 2), smoothed);

    // canvas に 1 度描かれてから、元の画像と入れ替える（空の canvas が一瞬見えるのを防ぐ）
    warmup += 1;
    if (warmup === 2) {
      view.classList.add('is-distorting');
    }
    if (settled && Math.abs(smoothed) < REST_SPEED) {
      deactivate();
    }
  }

  const onScroll = () => {
    settled = false;
    if (active || !motionPreference.allowed || !ensureLayer()) {
      return;
    }
    active = true;
    warmup = 0;
    measureView();
    gsap.ticker.add(frame);
  };
  const onSettle = () => {
    settled = true;
  };
  embla.on('scroll', onScroll);
  embla.on('settle', onSettle);

  const resizeObserver = new ResizeObserver(() => {
    measureView();
    layer?.resize();
  });
  resizeObserver.observe(view);
  // 途中で止められたら、すぐ元の画像へ戻す
  const unsubscribe = motionPreference.subscribe(() => {
    if (!motionPreference.allowed) {
      deactivate();
    }
  });

  return () => {
    disposed = true;
    deactivate();
    unsubscribe();
    resizeObserver.disconnect();
    layer?.dispose();
    layer = null;
  };
};

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
    const disposeDistortion = setupDistortion(carouselView, embla);

    cleanups.push(() => {
      unsubscribe();
      disposeDistortion();
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
