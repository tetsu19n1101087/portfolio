import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { LottieAnimation } from '@/components/lottie';

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1'>
        <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col-reverse md:grid md:grid-cols-[1fr_3fr] gap-8 lg:gap-12 items-center'>
              <div className='flex flex-col justify-center space-y-4 text-center md:text-left'>
                <div className='space-y-2'>
                  <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                    tetsu19n1101087
                  </h1>
                  {/* <p className="text-gray-500 md:text-xl dark:text-gray-400">ウェブ開発者 & デザイナー</p> */}
                </div>
                <div className='flex flex-col gap-2 min-[400px]:flex-row'>
                  <Button variant='outline'>
                    <Link href='/works'>作品を見る</Link>
                  </Button>
                </div>
              </div>
              <div className='flex items-center justify-center mb-8 md:mb-0'>
                {/* <Image
                  src='/home-image.svg'
                  alt='Progressive App Illustration'
                  width={800}
                  height={600}
                  className='w-full h-auto'
                  priority
                /> */}
                <LottieAnimation />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
