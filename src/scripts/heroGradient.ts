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

// 以下の待機はどれも、破棄（abort）されたら即座に解決する
const whenLoaded = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
      return;
    }
    window.addEventListener('load', () => resolve(), { once: true, signal });
    signal.addEventListener('abort', () => resolve(), { once: true });
  });

const whenIdle = (signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS });
      signal.addEventListener(
        'abort',
        () => {
          cancelIdleCallback(id);
          resolve();
        },
        { once: true },
      );
      return;
    }
    const id = setTimeout(resolve, 1);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(id);
        resolve();
      },
      { once: true },
    );
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
    signal.addEventListener(
      'abort',
      () => {
        observer.disconnect();
        resolve();
      },
      { once: true },
    );
  });

export const initHeroGradient = (root: HTMLElement): HeroGradientHandle => {
  const abort = new AbortController();
  const { signal } = abort;
  let renderer: HeroGradientRenderer | null = null;

  const start = async () => {
    const canvas = root.querySelector<HTMLCanvasElement>('.js-heroGradientCanvas');
    if (!canvas || prefersSaveData()) {
      return false;
    }
    // ソフトウェア描画など重い環境では null が返る（failIfMajorPerformanceCaveat）
    const context = createContext(canvas);
    if (!context) {
      return false;
    }

    await whenLoaded(signal);
    await whenIdle(signal);
    await whenVisible(canvas, signal);
    if (signal.aborted) {
      return false;
    }

    const { createHeroGradient } = await import('./heroGradient/renderer');
    if (signal.aborted) {
      return false;
    }
    renderer = await createHeroGradient({
      root,
      canvas,
      context,
      copyTargets: [...root.querySelectorAll<HTMLElement>('.js-heroGradientCopy')],
    });
    if (signal.aborted) {
      renderer?.dispose();
      renderer = null;
      return false;
    }
    return renderer !== null;
  };

  const ready = start().catch(() => false);

  return {
    ready,
    dispose() {
      abort.abort();
      renderer?.dispose();
      renderer = null;
    },
  };
};
