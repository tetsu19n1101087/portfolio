import Image from 'next/image';
import Link from 'next/link';
import { Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getWorks } from '@/lib/works';

export default async function WorksPage() {
  const works = await getWorks();

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1'>
        <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container mx-auto px-4 md:px-6 max-w-7xl'>
            <div className='flex flex-col items-center justify-center space-y-4 text-center'>
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                  Works
                </h1>
                {/* <p className='max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400'>
                  これまでに手がけたプロジェクトをご紹介します。
                </p> */}
              </div>
            </div>
            <div className='mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 py-12 lg:gap-8'>
              {works.map((work) => (
                <Card
                  key={work.id}
                  className='overflow-hidden flex flex-col'
                >
                  <Link
                    href={`/works/${work.id}`}
                    className='block relative aspect-video overflow-hidden'
                  >
                    <Image
                      src={work.image.url}
                      alt={work.title}
                      className='object-cover object-top transition-transform duration-300 hover:scale-110'
                      fill
                    />
                  </Link>
                  <CardContent className='p-4 flex flex-col flex-grow'>
                    <Link href={`/works/${work.id}`}>
                      <h3 className='text-xl font-bold hover:text-primary hover:underline transition-colors'>
                        {work.title}
                      </h3>
                    </Link>
                    <p className='text-sm truncate text-gray-500 dark:text-gray-400 mt-2'>
                      {work.description}
                    </p>
                    <div className='flex flex-wrap gap-2 my-4'>
                      {work.tags.map((tag) => (
                        <Badge key={tag.id}>{tag.name}</Badge>
                      ))}
                    </div>
                    <div className='flex gap-4 mt-auto'>
                      {work.codeLink && (
                        <Link
                          href={work.codeLink}
                          rel='noopener noreferrer'
                          target='_blank'
                        >
                          <Button size='sm' variant='outline' className='gap-1'>
                            <Code className='h-4 w-4' />
                            コード
                          </Button>
                        </Link>
                      )}
                      {work.demoLink && (
                        <Link
                          href={work.demoLink}
                          rel='noopener noreferrer'
                          target='_blank'
                        >
                          <Button size='sm' variant='outline' className='gap-1'>
                            <ExternalLink className='h-4 w-4' />
                            デモを見る
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
