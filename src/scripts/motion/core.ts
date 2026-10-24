import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** モーションを再生してよい条件。OS 設定の切り替えには gsap.matchMedia() で追従する */
export const MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

/** ポインタ追従など、マウス等の精細なポインタがある環境に限る演出の条件 */
export const FINE_POINTER_MOTION_QUERY = `${MOTION_QUERY} and (any-hover: hover) and (pointer: fine)`;

const READY_CLASS = 'is-motionReady';
const html = document.documentElement;

/**
 * BaseLayout のインラインスクリプトが付けた初期非表示がまだ有効か。
 * reduced-motion 時や、保険のタイマーで外れたあとに読み込まれた場合は false になり、登場演出を省く
 */
export const hasMotionReady = () => html.classList.contains(READY_CLASS);

/** 初期非表示を GSAP のインラインスタイルへ引き継いだあと、CSS 側の非表示を外す */
export const releaseMotionReady = () => {
  html.classList.remove(READY_CLASS);
};

export { gsap, ScrollTrigger };
