import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Code, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getWorkById } from '@/lib/works';
import { notFound } from 'next/navigation';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  const work = await getWorkById(id);

  if (!work) {
    notFound();
  }

  return (
    <div className='flex flex-col min-h-screen'>
      <Header />
      <main className='flex-1'>
        <div className='container mx-auto px-4 md:px-6 max-w-7xl py-12'>
          <div className='mb-6'>
            <Link
              href='/works'
              className='inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              作品一覧に戻る
            </Link>
          </div>
          <div className='max-w-3xl mx-auto'>
            <div>
              {/* <div className='relative aspect-video overflow-hidden rounded-lg mb-6'>
                <Image
                  src={work.images[1].url || '/placeholder.svg'}
                  alt={work.title}
                  className='object-cover object-top'
                  fill
                  priority
                />
              </div> */}
              <Carousel className='relative aspect-video overflow-hidden rounded-lg mb-6'>
                <CarouselContent>
                  {work.images.map((image, index) => (
                    <CarouselItem key={index} className='relative aspect-video'>
                      <Image
                        src={image.url || '/placeholder.svg'}
                        alt={work.title}
                        className='object-cover object-top brightness-99'
                        fill
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className='absolute left-2 top-1/2 -translate-y-1/2' />
                <CarouselNext className='absolute right-2 top-1/2 -translate-y-1/2' />
              </Carousel>
              <h1 className='text-3xl font-bold tracking-tight mb-4'>
                {work.title}
              </h1>
              <div className='flex items-center text-sm text-gray-500 mb-6'>
                <Calendar className='h-4 w-4 mr-1' />
                <span>{work.date}</span>
              </div>
              <div
                className='prose max-w-none dark:prose-invert mb-8 flex flex-col gap-4'
                dangerouslySetInnerHTML={{ __html: work.text }}
              />
              <div className='flex flex-wrap gap-2 mb-8'>
                {work.tags.map((tag) => (
                  <Badge key={tag.id} variant='secondary'>
                    {tag.name}
                  </Badge>
                ))}
              </div>
              <div className='flex flex-wrap gap-4'>
                {work.demoLink && (
                  <Button asChild className='gap-2'>
                    <a
                      href={work.demoLink}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <ExternalLink className='h-4 w-4' />
                      デモを見る
                    </a>
                  </Button>
                )}
                {work.codeLink && (
                  <Button asChild variant='outline' className='gap-2'>
                    <a
                      href={work.codeLink}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                      <Code className='h-4 w-4' />
                      コードを見る
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
