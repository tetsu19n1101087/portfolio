import { client } from './client';
import { Work } from '@/types/work';

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
