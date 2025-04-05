'use client'
import { useRouter } from 'next/router';
import { useEffect, ReactElement } from 'react';
import { useAuthState } from '../hooks';

interface AuthenticatedGuardProps {
  children: ReactElement;
  redirectTo?: string;
}

export const AuthenticatedGuard = ({
  children,
  redirectTo = '/login',
}: AuthenticatedGuardProps) => {
  const { isAuthenticated, loading } = useAuthState();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, loading, redirectTo, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
};