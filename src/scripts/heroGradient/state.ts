/**
 * Hero グラデーションを外部（GSAP など）から動かすための状態とループの差し替え口。
 * three.js に依存させないため、描画側とは別モジュールにしている。
 */

export interface HeroGradientState {
  /** 0〜1。流れの位置と色の濃さを少しずらす（スクロール連動などに使う） */
  progress: number;
  /** 0〜1。色の強さ。0 で白一色になる */
  intensity: number;
  /** 0〜1。ポインタ周りの渦の強さに掛ける係数 */
  pointerStrength: number;
}

/** 描画側が毎フレーム uniform へ写す。外部からは値を書き換えるだけでよい */
export const heroGradientState: HeroGradientState = {
  progress: 0,
  intensity: 1,
  pointerStrength: 1,
};

export type FrameCallback = () => void;

export interface HeroGradientTicker {
  add(callback: FrameCallback): void;
  remove(callback: FrameCallback): void;
}

const rafCallbacks = new Set<FrameCallback>();
let rafId = 0;

const runRafCallbacks = () => {
  rafId = rafCallbacks.size > 0 ? requestAnimationFrame(runRafCallbacks) : 0;
  rafCallbacks.forEach((callback) => callback());
};

/** 既定のループ。requestAnimationFrame を 1 本だけ回す */
export const rafTicker: HeroGradientTicker = {
  add(callback) {
    rafCallbacks.add(callback);
    if (rafId === 0) {
      rafId = requestAnimationFrame(runRafCallbacks);
    }
  },
  remove(callback) {
    rafCallbacks.delete(callback);
    if (rafCallbacks.size === 0 && rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  },
};

let currentTicker: HeroGradientTicker = rafTicker;
const tickerListeners = new Set<(next: HeroGradientTicker, previous: HeroGradientTicker) => void>();

export const getHeroGradientTicker = () => currentTicker;

/**
 * ループを外部の ticker に差し替える。null で既定の rAF に戻す。
 * 例: setHeroGradientTicker({ add: (cb) => gsap.ticker.add(cb), remove: (cb) => gsap.ticker.remove(cb) })
 */
export const setHeroGradientTicker = (ticker: HeroGradientTicker | null) => {
  const previous = currentTicker;
  currentTicker = ticker ?? rafTicker;
  if (previous !== currentTicker) {
    tickerListeners.forEach((listener) => listener(currentTicker, previous));
  }
};

export const onHeroGradientTickerChange = (
  listener: (next: HeroGradientTicker, previous: HeroGradientTicker) => void,
) => {
  tickerListeners.add(listener);
  return () => {
    tickerListeners.delete(listener);
  };
};
