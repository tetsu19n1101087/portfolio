import Image from 'next/image';
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
                <Image
                  src='/home-image.svg'
                  alt='Progressive App Illustration'
                  width={500}
                  height={400}
                  priority
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
