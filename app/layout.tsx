import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'HEY',
  description: 'クリエイターの仕事を、担当AIと一緒に片付ける',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">
        <div className="max-w-md mx-auto px-4 pt-6 pb-24">
          {children}
        </div>
        <NavBar />
      </body>
    </html>
  );
}
