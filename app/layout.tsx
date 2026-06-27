import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BrowserGuard } from '@/components/BrowserGuard';

const APP_URL = 'https://meora.aritude.com';

export const metadata: Metadata = {
  title: 'MEORA',
  description: 'あなただけのAIキャラクターと、もっと近くに。話し相手AIキャラクターアプリ。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MEORA',
  },
  openGraph: {
    title: 'MEORA',
    description: 'あなただけのAIキャラクターと、もっと近くに。',
    url: APP_URL,
    siteName: 'MEORA',
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MEORA',
    description: 'あなただけのAIキャラクターと、もっと近くに。',
    site: '@ryotanoe',
  },
};

export const viewport: Viewport = {
  themeColor: '#111111',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full">
        {children}
        <BrowserGuard />
      </body>
    </html>
  );
}
