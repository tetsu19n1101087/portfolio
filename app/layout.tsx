import type React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ポートフォリオ',
  description: '私のプロフェッショナルポートフォリオサイト',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ja' className='scroll-smooth'>
      <body className={inter.className}>
        <div className='min-h-screen flex flex-col'>{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
