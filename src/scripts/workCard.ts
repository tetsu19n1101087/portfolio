/**
 * 作品カードの演出。three.js には依存しない。
 *
 * - 出現: 画面に入ったとき、画像がノイズの境界から溶け出すように現れる。
 *   背景の描画側（WebGPU）が使えるときはシェーダーで、使えないときは CSS のトランジションで現れる
 * - 傾き: ポインタの位置に合わせてカードが立体的に傾く（マウスなど、細かく指せるポインタのときだけ）
 *
 * 動かしてよいとき（motionPreference.allowed）だけ有効にする。
 */
import { gsap } from 'gsap';
import { motionPreference } from '@/scripts/motion/preferences';
import { getStageRenderer } from '@/scripts/stage';

/** 画像の読み込みを待つ上限。超えたら演出なしで表示する */
const IMAGE_WAIT_MS = 4000;
const REVEAL_SECONDS = 1.6;

let cleanups: Array<() => void> = [];

const isBelowFold = (element: Element) => element.getBoundingClientRect().top > window.innerHeight * 0.95;

const whenImageReady = (image: HTMLImageElement) =>
  new Promise<boolean>((resolve) => {
    if (image.complete) {
      resolve(image.naturalWidth > 0);
      return;
    }
    const timer = window.setTimeout(() => resolve(false), IMAGE_WAIT_MS);
    const finish = (ok: boolean) => {
      window.clearTimeout(timer);
      resolve(ok);
    };
    image.addEventListener('load', () => finish(true), { once: true });
    image.addEventListener('error', () => finish(false), { once: true });
  });

const readColor = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const setupReveal = (card: HTMLElement) => {
  const image = card.querySelector<HTMLImageElement>('.js-workCardImage');
  const canvas = card.querySelector<HTMLCanvasElement>('.js-workCardCanvas');
  // すでに見えているカードは対象にしない。いったん隠して出し直すと、ちらついて見えるため
  if (!image || !isBelowFold(card)) {
    return;
  }

  let active = true;
  let dispose: (() => void) | null = null;

  // 隠した状態を解く。CSS 側で、画像がフェードしながら現れるトランジションが付いている
  const show = () => {
    card.classList.remove('is-revealPending');
  };
  const finish = () => {
    active = false;
    observer.disconnect();
    dispose?.();
    dispose = null;
    card.classList.remove('is-revealPending', 'is-revealCanvas');
  };

  const play = async () => {
    const loaded = await whenImageReady(image);
    if (!active) {
      return;
    }
    // canvas に大きさを持たせてから描き先を作る
    card.classList.add('is-revealCanvas');
    const reveal =
      loaded && canvas
        ? ((await getStageRenderer()?.createImageReveal({
            canvas,
            image,
            surfaceColor: readColor('--color-surface', '#0f172a'),
            glowColor: readColor('--color-accent', '#0ea5a4'),
          })) ?? null)
        : null;
    if (!active) {
      // 準備している間にページを離れた・停止された
      reveal?.dispose();
      return;
    }

    if (!reveal) {
      // シェーダーが使えないときは、CSS のトランジションだけで現す
      card.classList.remove('is-revealCanvas');
      show();
      active = false;
      return;
    }

    // canvas が画像を覆っている間に、下の画像は表示状態へ戻しておく
    show();
    const state = { progress: 0 };
    const tween = gsap.to(state, {
      progress: 1,
      duration: REVEAL_SECONDS,
      ease: 'power2.out',
      onUpdate: () => reveal.setProgress(state.progress),
      onComplete: finish,
    });
    dispose = () => {
      tween.kill();
      reveal.dispose();
    };
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void play();
      }
    },
    { threshold: 0.2 },
  );

  card.classList.add('is-revealPending');
  observer.observe(card);
  cleanups.push(finish);
};

const setupTilt = (card: HTMLElement) => {
  const abort = new AbortController();

  const reset = () => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    card.style.removeProperty('--tilt-active');
  };

  card.addEventListener(
    'pointermove',
    (event) => {
      const rect = card.getBoundingClientRect();
      // カードの中央を 0、端を ±1 とする
      card.style.setProperty('--tilt-x', (((event.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
      card.style.setProperty('--tilt-y', (((event.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
      card.style.setProperty('--tilt-active', '1');
    },
    { signal: abort.signal },
  );
  card.addEventListener('pointerleave', reset, { signal: abort.signal });

  cleanups.push(() => {
    abort.abort();
    reset();
  });
};

const teardown = () => {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
};

const sync = () => {
  teardown();
  if (!motionPreference.allowed) {
    return;
  }
  const canTilt = window.matchMedia('(any-hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll<HTMLElement>('.js-workCard').forEach((card) => {
    if (card.dataset.cardReveal === 'scroll') {
      setupReveal(card);
    }
    if (canTilt) {
      setupTilt(card);
    }
  });
};

// クライアントサイド遷移ではこのスクリプトは 1 回しか実行されないため、ページが替わるたびに組み立て直す
document.addEventListener('astro:page-load', sync);
document.addEventListener('astro:before-swap', teardown);
motionPreference.subscribe(sync);
// 遷移で初めてこのスクリプトが読み込まれた場合、astro:page-load に間に合わないことがある
sync();
