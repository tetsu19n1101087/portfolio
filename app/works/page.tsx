import Image from 'next/image';
import Link from 'next/link';
import { Github, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

import getWorks from '@/lib/getWorks';

export default function WorksPage() {
  const works = getWorks();

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
                <p className='max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400'>
                  これまでに手がけたプロジェクトをご紹介します。
                </p>
              </div>
            </div>
            <div className='mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-2 gap-6 py-12 lg:gap-8'>
              {works.map((project) => (
                <Card key={project.id} className='overflow-hidden'>
                  <div className='relative aspect-video overflow-hidden'>
                    <Image
                      src={project.image}
                      alt={project.title}
                      className='object-cover'
                      fill
                    />
                  </div>
                  <CardContent className='p-4'>
                    <h3 className='text-xl font-bold'>{project.title}</h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mt-2'>
                      {project.description}
                    </p>
                    <div className='flex flex-wrap gap-2 mt-4'>
                      {project.tags.map((tag, index) => (
                        <Badge key={index}>{tag}</Badge>
                      ))}
                    </div>
                    <div className='flex gap-4 mt-4'>
                      <Link href={project.demoLink}>
                        <Button size='sm' variant='outline' className='gap-1'>
                          <ExternalLink className='h-4 w-4' />
                          デモを見る
                        </Button>
                      </Link>
                      <Link href={project.codeLink}>
                        <Button size='sm' variant='outline' className='gap-1'>
                          <Github className='h-4 w-4' />
                          コード
                        </Button>
                      </Link>
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
