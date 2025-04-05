// apps/auth-example/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from '@my-monorepo/shell';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuthState();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, loading, router]);

  return <div>Redirecting...</div>;
}