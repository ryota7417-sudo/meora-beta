'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'ホーム', exact: true },
  { href: '/chat', label: 'チャット', exact: false },
  { href: '/tasks', label: 'タスク', exact: false },
  { href: '/daily-report', label: '日報', exact: false },
  { href: '/learning', label: '学習候補', exact: false },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white safe-bottom">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 items-center justify-center px-1 text-center text-[11px] font-medium transition-colors ${
                active ? 'text-amber-600' : 'text-gray-400'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
