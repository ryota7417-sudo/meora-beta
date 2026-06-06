import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { NavBar } from '@/components/NavBar';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'HEY!おぴよ!',
  description: 'クリエイターのためのアシスタントアプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.className} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <div className="max-w-md mx-auto px-4 pt-6 pb-24">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
