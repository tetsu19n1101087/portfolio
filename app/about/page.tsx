import Image from 'next/image';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Github, Mail } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1'>
        {/* <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col items-center justify-center space-y-4 text-center'>
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                  About
                </h1>
                <p className='max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400'>
                  ここにあなたの経歴や自己紹介を書きます。あなたのスキル、経験、情熱について説明してください。
                  読者があなたについてもっと知りたいと思うような魅力的な内容にしましょう。
                </p>
              </div>
            </div>
          </div>
        </section> */}
        <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col items-center justify-center space-y-4 text-center mb-12'>
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                  About
                </h1>
              </div>
            </div>

            <div className='flex flex-col md:flex-row gap-12 max-w-5xl mx-auto'>
              <div className='md:w-1/3'>
                <div className='relative w-full aspect-square overflow-hidden rounded-full'>
                  <Image
                    src='/face.png'
                    alt='プロフィール画像'
                    fill
                    className='object-cover'
                  />
                </div>
              </div>

              <div className='md:w-2/3 space-y-8'>
                <div>
                  <h2 className='text-3xl font-bold'>Tetsuro Tsunehara</h2>
                  {/* <p className="text-xl text-gray-600">やまだ たろう</p> */}
                </div>

                <div className='space-y-4'>
                  <p className='text-gray-700 dark:text-gray-300'>
                    2004年生まれ。千葉県出身。
                  </p>
                  <p className='text-gray-700 dark:text-gray-300'>
                    Webアプリの開発と、機械学習などのデータサイエンスについて学んでいます。
                  </p>
                  <p className='text-gray-700 dark:text-gray-300'>
                    高校在学中に独学でプログラミングの勉強を始め、Node.jsを使用したWebアプリ開発や、ディープラーニングによる画像分類モデルの開発などを行ってきました。
                    また、企業のインターンシップに参加し、Gitを活用したチーム開発や、AWSを用いたインフラ構築など、実践的な経験もしました。
                  </p>
                  <p className='text-gray-700 dark:text-gray-300'>
                    フロントエンドやバックエンドを問わず幅広い技術に対する理解を深め、ユーザーにとって心地良い体験を提供できるエンジニアを目指しています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className='w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col items-center justify-center space-y-4 text-center mb-12'>
              <div className='space-y-2'>
                <h2 className='text-3xl font-bold tracking-tighter sm:text-3xl'>
                  Skill
                </h2>
                {/* <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  私が持っているスキルと技術をご紹介します。
                </p> */}
              </div>
            </div>

            <div className='max-w-4xl mx-auto space-y-8'>
              <div className='space-y-2'>
                <h3 className='text-xl font-bold'>言語</h3>
                <p className='text-gray-700 dark:text-gray-300'>
                  HTML / CSS / JavaScript / TypeScript / Python
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='text-xl font-bold'>フレームワーク</h3>
                <p className='text-gray-700 dark:text-gray-300'>
                  React / Next.js / Express.js / Flask / Bootstrap / Tailwind
                  CSS
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='text-xl font-bold'>データベース</h3>
                <p className='text-gray-700 dark:text-gray-300'>
                  PostgreSQL / MongoDB
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='text-xl font-bold'>インフラ</h3>
                <p className='text-gray-700 dark:text-gray-300'>
                  AWS / Firebase / Vercel
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='text-xl font-bold'>データサイエンス</h3>
                <p className='text-gray-700 dark:text-gray-300'>
                  NumPy / Keras / TensorFlow / Pandas / Google Colab / R /
                  RStudio
                </p>
              </div>

              <div className='space-y-2'>
                <h3 className='text-xl font-bold'>その他ツール</h3>
                <p className='text-gray-700 dark:text-gray-300'>
                  VSCode / Git / Docker / Kubernetes
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col items-center justify-center space-y-4 text-center mb-12'>
              <div className='space-y-2'>
                <h2 className='text-3xl font-bold tracking-tighter sm:text-3xl'>
                  Link
                </h2>
              </div>
            </div>

            <div className='max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6'>
              <a
                href='https://github.com/tetsu19n1101087'
                target='_blank'
                rel='noopener noreferrer'
                className='flex flex-col items-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow'
              >
                <Github className='h-8 w-8 mb-3' />
                <h3 className='font-medium'>GitHub</h3>
                <p className='text-sm text-gray-500'>@tetsu19n1101087
                </p>
              </a>

              <a
                href='mailto:22l1073z@student.gs.chiba-u.jp'
                className='flex flex-col items-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow'
              >
                <Mail className='h-8 w-8 mb-3' />
                <h3 className='font-medium'>メール</h3>
                <p className='text-sm text-gray-500'>22l1073z@student.gs.chiba-u.jp</p>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
