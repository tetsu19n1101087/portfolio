/**
 * Hero の液体グラデーションの入口。three.js には依存しない。
 * 使える環境か判定し、ページの読み込みと可視を待ってから three.js 側を動的 import する。
 * 使えないときは何もせず、背面の CSS グラデーションがそのまま見える。
 */
import type { HeroGradientRenderer } from './heroGradient/renderer';

export { heroGradientState, setHeroGradientTicker } from './heroGradient/state';
export type { HeroGradientState, HeroGradientTicker } from './heroGradient/state';

export interface HeroGradientHandle {
  /** 描画を始められたら true、使えない環境や破棄済みなら false */
  ready: Promise<boolean>;
  dispose(): void;
}

const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: 'low-power',
  failIfMajorPerformanceCaveat: true,
};

const IDLE_TIMEOUT_MS = 2000;

interface NavigatorWithConnection extends Navigator {
  connection?: { saveData?: boolean };
}

const prefersSaveData = () => (navigator as NavigatorWithConnection).connection?.saveData === true;

const createContext = (canvas: HTMLCanvasElement) => {
  try {
    return canvas.getContext('webgl2', CONTEXT_ATTRIBUTES);
  } catch {
    return null;
  }
};

/** abort 済みなら即座に、そうでなければ abort されたときに呼ぶ */
const onAbort = (signal: AbortSignal, callback: () => void) => {
  if (signal.aborted) {
    callback();
    return;
  }
  signal.addEventListener('abort', callback, { once: true });
};

// 以下の待機はどれも、破棄（abort）されたら即座に解決する
const whenLoaded = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    window.addEventListener('load', () => resolve(), { once: true, signal });
    onAbort(signal, resolve);
  });

const whenIdle = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
      onAbort(signal, () => {
        cancelIdleCallback(id);
        resolve();
      });
      return;
    }
    const id = setTimeout(resolve, 1);
    onAbort(signal, () => {
      clearTimeout(id);
      resolve();
    });
  });

const whenVisible = (target: Element, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(target);
    onAbort(signal, () => {
      observer.disconnect();
      resolve();
    });
  });

/** 一時停止ボタン（WCAG 2.2.2）。動いているときだけ見せる */
const setupToggle = (button: HTMLButtonElement | null, renderer: HeroGradientRenderer, signal: AbortSignal) => {
  if (!button) {
    return;
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const syncVisibility = () => {
    button.hidden = signal.aborted || reducedMotion.matches;
  };
  syncVisibility();
  reducedMotion.addEventListener('change', syncVisibility, { signal });
  button.addEventListener(
    'click',
    () => {
      const paused = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(paused));
      renderer.setPaused(paused);
    },
    { signal },
  );
  onAbort(signal, syncVisibility);
};

export const initHeroGradient = (root: HTMLElement): HeroGradientHandle => {
  const abort = new AbortController();
  const { signal } = abort;

  const start = async () => {
    const canvas = root.querySelector<HTMLCanvasElement>('.js-heroGradientCanvas');
    if (!canvas || prefersSaveData()) {
      return false;
    }

    await whenLoaded(signal);
    await whenIdle(signal);
    if (signal.aborted) {
      return false;
    }
    // コンテキスト生成は GPU プロセスの起動を伴うので、読み込みとアイドルを待ってから行う。
    // ソフトウェア描画など重い環境では null が返る（failIfMajorPerformanceCaveat）
    const context = createContext(canvas);
    if (!context) {
      return false;
    }
    const releaseContext = () => context.getExtension('WEBGL_lose_context')?.loseContext();

    await whenVisible(canvas, signal);
    if (signal.aborted) {
      releaseContext();
      return false;
    }

    const { createHeroGradient } = await import('./heroGradient/renderer');
    if (signal.aborted) {
      releaseContext();
      return false;
    }
    const renderer = await createHeroGradient({
      root,
      canvas,
      context,
      copyTargets: [...root.querySelectorAll<HTMLElement>('.js-heroGradientCopy')],
      signal,
      // コンテキスト喪失で内部から破棄されたら、ボタンなどもまとめて片付ける
      onDispose: () => abort.abort(),
    });
    if (!renderer) {
      return false;
    }
    setupToggle(root.querySelector<HTMLButtonElement>('.js-heroGradientToggle'), renderer, signal);
    return true;
  };

  const ready = start().catch(() => false);

  return {
    ready,
    dispose() {
      abort.abort();
    },
  };
};
