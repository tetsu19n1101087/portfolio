import { StaticImageData } from 'next/image';

import escapeGameImage from '@/public/escape-game.png';
import nsTypingImage from '@/public/ns-typing.png';

type Work = {
  id: string;
  title: string;
  description: string;
  image: StaticImageData;
  tags: string[];
  demoLink: string;
  codeLink: string;
  date: string;
  longDescription: string;
};

const works: Work[] = [
  {
    id: '1',
    title: 'NS-TYPING',
    description: '数字・記号専用のタイピング練習ゲーム',
    image: nsTypingImage,
    tags: ['React', 'Next.js', 'TypeScript', 'styled-components', 'MongoDB'],
    demoLink: 'https://tetsu19n1101087-game.vercel.app/',
    codeLink: 'https://github.com/tetsu19n1101087/tetsu19n1101087-game',
    date: '2024年10月',
    longDescription: `プロジェクト1の詳細な説明。
    ここにはプロジェクトの目的、使用技術、開発プロセスなどを詳しく記載します。例えば、ReactとNext.jsを使用して、レスポンシブなウェブアプリケーションを開発しました。デザインにはTailwind CSSを採用し、ユーザーインターフェースを直感的にしました。`,
  },
  {
    id: '2',
    title: '脱出ゲーム「歪んだ童話世界からの脱出」',
    description: 'オンライン脱出ゲームの制作',
    image: escapeGameImage,
    tags: ['HTML', 'JavaScript', 'Bootstrap'],
    demoLink: 'https://tetsu19n1101087.github.io/escape-game/',
    codeLink: 'https://github.com/tetsu19n1101087/escape-game',
    date: '2021年9月',
    longDescription: `オンライン脱出ゲームの制作。HTML、JavaScript、Bootstrapを使用して、ユーザーが謎を解きながらストーリーを進める形式のゲームを作成しました。ゲームのデザインやストーリー展開にも力を入れ、プレイヤーが楽しめるような工夫をしました。`,
  },
  // 他のプロジェクトも同様に追加
];

export function getWorks() {
  return works;
}

export function getWorkById(id: string) {
  return works.find((work) => work.id === id);
}
