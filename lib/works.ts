import { client } from './client';
import { Work } from '@/types/work';

export async function getWorks() {
  try {
    const data = await client.get({
      endpoint: 'works',
    });
    const works: Work[] = data.contents;
    return works;
  } catch (error) {
    console.error('error: ', error);
    return [];
  }
}

export async function getWorkById(contentId: string) {
  try {
    const work: Work = await client.get({
      endpoint: 'works',
      contentId,
    });
    return work;
  } catch (error) {
    console.error('error: ', error);
    return null;
  }
}
