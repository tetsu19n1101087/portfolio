import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { gsap } from '@/scripts/motion/core';

// スクロール連動の演出だけが使う。作品詳細ページのバンドルに含めないよう core から分ける
gsap.registerPlugin(ScrollTrigger);

export { ScrollTrigger };
