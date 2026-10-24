import type { WorkCardHoverEffect } from './workCardHoverEffect';

type HoveredCard = {
  media: HTMLElement;
  image: HTMLImageElement;
  clientX: number;
  clientY: number;
};

// canvas を全カードで 1 枚共有するため、ページ内のカードをまとめて扱う
const cards = document.querySelectorAll<HTMLElement>('.js-workCard');
const pointerQuery = window.matchMedia('(any-hover: hover) and (pointer: fine)');
const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');

let effect: WorkCardHoverEffect | null = null;
let loading: Promise<void> | null = null;
let isUnsupported = false;
let hovered: HoveredCard | null = null;

const isAllowed = () => !isUnsupported && pointerQuery.matches && motionQuery.matches;

function load() {
  if (loading || !isAllowed()) {
    return loading;
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'c-WorkCard__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    failIfMajorPerformanceCaveat: true,
  });

  if (!context) {
    isUnsupported = true;
    return null;
  }

  loading = import('./workCardHoverEffect')
    .then(({ createWorkCardHoverEffect }) => {
      effect = createWorkCardHoverEffect(canvas, context, {
        onContextLost: () => {
          isUnsupported = true;
          effect = null;
        },
      });

      if (hovered && isAllowed()) {
        void effect.enter(hovered.media, hovered.image, hovered.clientX, hovered.clientY);
      }
    })
    .catch(() => {
      isUnsupported = true;
      context.getExtension('WEBGL_lose_context')?.loseContext();
    });

  return loading;
}

function loadWhenIdle() {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void load(), { timeout: 3000 });
  } else {
    setTimeout(() => void load(), 200);
  }
}

function handleQueryChange() {
  if (!isAllowed()) {
    hovered = null;
    effect?.reset();
  }
}

if (cards.length > 0) {
  pointerQuery.addEventListener('change', handleQueryChange);
  motionQuery.addEventListener('change', handleQueryChange);

  // グリッドが見えたらアイドル時に読み込む（初回ホバーが先ならそちらで読み込む）
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      loadWhenIdle();
    }
  });

  cards.forEach((card) => {
    const media = card.querySelector<HTMLElement>('.js-workCardMedia');
    const image = media?.querySelector('img');

    if (!media || !image) {
      return;
    }

    observer.observe(card);

    card.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'touch' || !isAllowed()) {
        return;
      }

      hovered = { media, image, clientX: event.clientX, clientY: event.clientY };

      if (effect) {
        void effect.enter(media, image, event.clientX, event.clientY);
      } else {
        void load();
      }
    });

    card.addEventListener('pointermove', (event) => {
      if (hovered?.media !== media) {
        return;
      }

      hovered.clientX = event.clientX;
      hovered.clientY = event.clientY;
      effect?.move(event.clientX, event.clientY);
    });

    card.addEventListener('pointerleave', () => {
      if (hovered?.media === media) {
        hovered = null;
      }

      effect?.leave(media);
    });
  });
}
