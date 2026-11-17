/**
 * 動きを出してよいかの判定を一か所にまとめる。
 * 止める理由は 2 つある。利用者が停止ボタンを押した場合と、OS で「視差効果を減らす」を選んでいる場合。
 * 背景の描画・DOM のアニメーション・カルーセルの自動再生は、すべてここを見て動きを決める。
 */

const STORAGE_KEY = 'motion-paused';
const PAUSED_CLASS = 'is-motionPaused';
/** このページで一度でも動きを止めた印。再生に戻したときに、出現アニメーションをやり直さないために付ける */
const REVEAL_DONE_CLASS = 'is-revealDone';

type Listener = () => void;

const listeners = new Set<Listener>();
const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

// プライベートブラウズなどで localStorage が使えない環境では、保存せずに動かす
const readStored = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const writeStored = (value: boolean) => {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // 保存できなくても、このページを開いている間は効く
  }
};

let paused = readStored();

// ページ遷移で <html> の属性は置き換わるので、REVEAL_DONE_CLASS は次のページには持ち越されない
const syncRootClass = () => {
  const root = document.documentElement;
  root.classList.toggle(PAUSED_CLASS, paused);
  if (paused || reducedQuery.matches) {
    root.classList.add(REVEAL_DONE_CLASS);
  }
};

const notify = () => {
  syncRootClass();
  listeners.forEach((listener) => listener());
};

export const motionPreference = {
  /** 利用者が停止ボタンで止めている */
  get paused() {
    return paused;
  },
  /** OS の設定で動きを減らすよう求められている */
  get reduced() {
    return reducedQuery.matches;
  },
  /** 動かしてよい */
  get allowed() {
    return !paused && !reducedQuery.matches;
  },
  setPaused(next: boolean) {
    if (next === paused) {
      return;
    }
    paused = next;
    writeStored(next);
    notify();
  },
  /** 状態が変わるたびに呼ぶ。戻り値で解除する */
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

reducedQuery.addEventListener('change', notify);
// ページ遷移で <html> の属性が新しいページのものに置き換わるため、付け直す
document.addEventListener('astro:after-swap', syncRootClass);
syncRootClass();
