import { client } from '@/lib/client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await client.get({
      endpoint: 'works',
    });

    return NextResponse.json(data.title);
  } catch (error) {
    console.error('error: ', error);

    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 400 }
    );
  }
}
