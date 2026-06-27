'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadState } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { resolveAuth } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const { promise, cancel } = resolveAuth(supabase, { graceMs: 1500 });

    let active = true;
    promise.then((loggedIn) => {
      if (!active) return;

      const state = loadState();
      if (!loggedIn || !state.onboardingDone) {
        router.replace('/onboarding');
        return;
      }

      router.replace('/dashboard');
    });

    return () => { active = false; cancel(); };
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f5f0' }}>
      <span style={{ fontSize: 16, color: '#888' }}>...</span>
    </div>
  );
}
