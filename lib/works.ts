import { client } from './client';
import { Work } from '@/types/work';

// type Work = {
//   id: string;
//   title: string;
//   description: string;
//   image: string;
//   tags: string[];
//   demoLink?: string;
//   codeLink: string;
//   date: string;
//   longDescription: string;
// };

async function fetchWorks() {
  try {
    const data = await client.get({
      endpoint: 'works',
    });
    return data.contents;
  } catch (error) {
    console.error('error: ', error);
    return [];
  }
}

export async function getWorks() {
  const works: Work[] = await fetchWorks();
  return works;
}

export async function getWorkById(id: string) {
  const works: Work[] = await fetchWorks();
  return works.find((work) => work.id === id);
}

// const works: Work[] = [
//   {
//     id: '1',
//     title: 'NS-TYPING',
//     description: '数字・記号専用のタイピング練習ゲーム',
//     image: '/ns-typing-mock.png',
//     tags: [
//       'React',
//       'Next.js',
//       'TypeScript',
//       'styled-components',
//       'MongoDB',
//       'Kubernetes',
//     ],
//     demoLink: 'https://tetsu19n1101087-game.vercel.app/',
//     codeLink: 'https://github.com/tetsu19n1101087/tetsu19n1101087-game',
//     date: '2024年10月',
//     longDescription: `学習のアウトプットとして、タイピングゲームを制作。
//     ランダムな数字や記号が1文字ずつ表示され、タイピングの素早さと正確さを測ることができます。結果画面には正解率やミス数などが表示され、過去の結果と比較することができます。
//     Next.jsを使用し、フロントエンドからAPIまでを一貫して開発しました。データベースにはMongoDB Atlasを使用し、ユーザーの結果を保存しています。さらに、コンテナ化されたアプリとして Kubernetes で管理できるよう設計しました。`,
//   },
//   {
//     id: '2',
//     title: '脱出ゲーム「歪んだ童話世界からの脱出」',
//     description: 'オンライン脱出ゲームの制作',
//     image: '/escape-game.png',
//     tags: ['HTML', 'JavaScript', 'Bootstrap'],
//     demoLink: 'https://tetsu19n1101087.github.io/escape-game/',
//     codeLink: 'https://github.com/tetsu19n1101087/escape-game',
//     date: '2021年9月',
//     longDescription: `グループでのオンライン脱出ゲームの制作。
//     ユーザーが謎を解きながらストーリーを進める形式のオンライン脱出ゲームを作成しました。小学校高学年の生徒が複数人で遊ぶことを想定し、ゲームのデザインやストーリー展開を工夫しました。
//     担当範囲：コーディング
//     チーム人数：4人
//     制作期間：1ヶ月`,
//   },
//   {
//     id: '3',
//     title: '予定調整くん',
//     description: 'スケジュール調整アプリ',
//     image: '/schedule-arranger-mock.png',
//     tags: ['JavaScript', 'Express', 'Bootstrap', 'PostgreSQL'],
//     demoLink: 'https://schedule-arranger-ch6e.onrender.com/',
//     codeLink: 'https://github.com/tetsu19n1101087/schedule-arranger',
//     date: '2021年4月',
//     longDescription: `学習のアウトプットとして、スケジュール調整アプリを制作。
//     GitHubのアカウントでログインでき、予定を作成することができます。作成した予定はリンクを使って他のユーザーと共有することができ、ユーザーは出欠を登録したり、コメントを残したりすることができます。
//     サーバーサイドにExpressを使用し、見た目はBootstrapで整えました。データベースはPostgreSQLを使用しました。また、AJAXを使用することで、出欠の登録をページを読み込まずに即座に反映できるよう工夫しました。`,
//   },
//   {
//     id: '4',
//     title: 'ホットドッグ判定',
//     description: '画像を判定するアプリ',
//     image: '/hotdog-mock.png',
//     tags: ['Python', 'Flask', 'Keras'],
//     codeLink: 'https://github.com/tetsu19n1101087/flask-hotdog',
//     date: '2020年10月',
//     longDescription: `学習のアウトプットとして、画像を判定するアプリを制作。
//     画像をアップロードすると、それがホットドッグであるかを判定し、ホットドッグである確率を返してくれます。
//     ディープラーニングを用いて画像分類モデルを作成し、アプリのバックエンドに組み込んでいます。`,
//   },
//   {
//     id: '5',
//     title: '芝居茶屋',
//     description: '日本の伝統芸能を発信するWebサイト',
//     image: '/shibaichaya.png',
//     tags: ['HTML', 'CSS', 'JavaScript'],
//     codeLink: 'https://github.com/nagito-hiroshima/SHIBAICHAYA-Web',
//     date: '2021年3月',
//     longDescription: `日本の伝統芸能の奥深さ・楽しさ・素晴らしさを探求し、それを同世代に発信するWebサイトをチームで制作。
//     専門家のインタビューやクイズなどのコンテンツを通じて、演芸や音楽といった伝統芸能の魅力を伝えることを目的としています。また、ページ遷移のたびに色づきが増えるといった工夫を行い、ユーザーに長く留まってもらえるよう心がけました。
//     担当範囲：コーディング
//     チーム人数：10人
//     制作期間：3ヶ月`,
//   },
// ];

