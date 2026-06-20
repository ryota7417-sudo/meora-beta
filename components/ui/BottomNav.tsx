'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  {
    href: '/dashboard',
    label: 'ホーム',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9L11 2L19 9V20H14V14H8V20H3V9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
  {
    href: '/market',
    label: 'マーケット',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <polygon points="11,2 13.5,8 20,8 15,12 17,18 11,14 5,18 7,12 2,8 8.5,8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
  {
    href: '/settings',
    label: '設定',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M11 2V4M11 18V20M2 11H4M18 11H20M4.2 4.2L5.6 5.6M16.4 16.4L17.8 17.8M4.2 17.8L5.6 16.4M16.4 5.6L17.8 4.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        height: 64,
        background: '#fff',
        borderTop: '2px solid #111',
        display: 'flex',
        zIndex: 200,
      }}
      aria-label="メインナビゲーション"
    >
      {TABS.map((tab, i) => {
        const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              fontSize: 12,
              fontWeight: 700,
              color: active ? '#111' : '#999',
              textDecoration: 'none',
              borderRight: i < TABS.length - 1 ? '1px solid #eee' : 'none',
              background: active ? '#f8f8f4' : '#fff',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.02em',
              transition: 'background 0.1s',
            }}
          >
            {tab.icon}
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
