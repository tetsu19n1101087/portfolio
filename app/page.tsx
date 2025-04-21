// import Image from 'next/image';
import Link from 'next/link';
// import { Github, Mail, Linkedin } from "lucide-react"

import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1'>
        <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col-reverse md:grid md:grid-cols-2 gap-8 lg:gap-12 items-center'>
              <div className='flex flex-col justify-center space-y-4 text-center md:text-left'>
                <div className='space-y-2'>
                  <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                    tetsu19n1101087
                  </h1>
                  {/* <p className="text-gray-500 md:text-xl dark:text-gray-400">ウェブ開発者 & デザイナー</p> */}
                </div>
                <div className='flex flex-col gap-2 min-[400px]:flex-row'>
                  {/* <Button className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300">
                    <Link href="/contact">お問い合わせ</Link>
                  </Button> */}
                  <Button variant='outline'>
                    <Link href='/works'>作品を見る</Link>
                  </Button>
                </div>
                {/* <div className="flex gap-4">
                  <Link href="#" target="_blank" rel="noreferrer">
                    <Github className="h-5 w-5" />
                    <span className="sr-only">GitHub</span>
                  </Link>
                  <Link href="#" target="_blank" rel="noreferrer">
                    <Linkedin className="h-5 w-5" />
                    <span className="sr-only">LinkedIn</span>
                  </Link>
                  <Link href="mailto:email@example.com">
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Email</span>
                  </Link>
                </div> */}
              </div>
              <div className='flex items-center justify-center mb-8 md:mb-0'>
                {/* <Image
                  alt='Profile'
                  className='rounded-full object-cover border-4 border-gray-100 dark:border-gray-800'
                  height={400}
                  width={400}
                  src='/placeholder.svg?height=400&width=400'
                  priority
                /> */}
                <div className='w-full max-w-md h-80 relative'>
                  <svg
                    className='w-full h-full'
                    viewBox='0 0 400 400'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    {/* 背景の円 */}
                    <circle cx='200' cy='200' r='180' fill='#f3f4f6' />

                    {/* デスクトップ */}
                    <rect
                      x='100'
                      y='200'
                      width='200'
                      height='120'
                      rx='4'
                      fill='#374151'
                    />
                    <rect
                      x='110'
                      y='210'
                      width='180'
                      height='100'
                      rx='2'
                      fill='#60a5fa'
                    />

                    {/* コード表示 (アニメーション) */}
                    <g className='animate-pulse'>
                      <rect
                        x='120'
                        y='220'
                        width='100'
                        height='6'
                        rx='1'
                        fill='white'
                      />
                      <rect
                        x='120'
                        y='235'
                        width='80'
                        height='6'
                        rx='1'
                        fill='white'
                      />
                      <rect
                        x='120'
                        y='250'
                        width='120'
                        height='6'
                        rx='1'
                        fill='white'
                      />
                      <rect
                        x='120'
                        y='265'
                        width='60'
                        height='6'
                        rx='1'
                        fill='white'
                      />
                      <rect
                        x='120'
                        y='280'
                        width='90'
                        height='6'
                        rx='1'
                        fill='white'
                      />
                    </g>

                    {/* デスクトップスタンド */}
                    <rect
                      x='180'
                      y='320'
                      width='40'
                      height='10'
                      rx='2'
                      fill='#374151'
                    />
                    <rect
                      x='190'
                      y='330'
                      width='20'
                      height='20'
                      rx='2'
                      fill='#374151'
                    />

                    {/* 浮遊する要素 (アニメーション) */}
                    <g className='animate-bounce'>
                      <circle
                        cx='130'
                        cy='140'
                        r='20'
                        fill='#ec4899'
                        opacity='0.8'
                      />
                    </g>
                    <g
                      className='animate-bounce'
                      style={{ animationDelay: '0.5s' }}
                    >
                      <circle
                        cx='270'
                        cy='140'
                        r='20'
                        fill='#8b5cf6'
                        opacity='0.8'
                      />
                    </g>
                    <g
                      className='animate-bounce'
                      style={{ animationDelay: '1s' }}
                    >
                      <circle
                        cx='200'
                        cy='140'
                        r='20'
                        fill='#10b981'
                        opacity='0.8'
                      />
                    </g>

                    {/* 追加の装飾要素 */}
                    <g
                      className='animate-pulse'
                      style={{ animationDelay: '1.5s' }}
                    >
                      <path
                        d='M80 180 L120 180'
                        stroke='#f59e0b'
                        strokeWidth='4'
                        strokeLinecap='round'
                      />
                      <path
                        d='M70 160 L110 160'
                        stroke='#f59e0b'
                        strokeWidth='4'
                        strokeLinecap='round'
                      />
                      <path
                        d='M75 140 L105 140'
                        stroke='#f59e0b'
                        strokeWidth='4'
                        strokeLinecap='round'
                      />
                    </g>

                    <g
                      className='animate-pulse'
                      style={{ animationDelay: '0.8s' }}
                    >
                      <path
                        d='M280 180 L320 180'
                        stroke='#3b82f6'
                        strokeWidth='4'
                        strokeLinecap='round'
                      />
                      <path
                        d='M290 160 L330 160'
                        stroke='#3b82f6'
                        strokeWidth='4'
                        strokeLinecap='round'
                      />
                      <path
                        d='M295 140 L325 140'
                        stroke='#3b82f6'
                        strokeWidth='4'
                        strokeLinecap='round'
                      />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
