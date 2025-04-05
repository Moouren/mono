// apps/online-sales/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState, useAuth } from '@my-monorepo/shell';
import { App } from 'antd';

// URL of the auth app login page
const AUTH_APP_LOGIN_URL = 'http://localhost:3001/login';

export default function Home() {
  const router = useRouter();
  const { message } = App.useApp();
  const { isAuthenticated, loading, user,...rest } = useAuthState();
  const { setRedirectAfterLogin } = useAuth();
  console.log('heere',user,isAuthenticated,rest)
  useEffect(() => {
    // Handle authentication state
    if (!loading) {
      if (isAuthenticated && user) {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
        message.success(`Welcome back, ${user.name}!`);
      } else {
        // User is not authenticated, save current app URL and redirect to login
        const currentAppUrl = window.location.origin;
        
        // Store redirect URL before going to login page
        setRedirectAfterLogin(currentAppUrl + '/dashboard');
        
        // Add returnUrl parameter to help auth app know where to redirect back
        const loginUrl = `${AUTH_APP_LOGIN_URL}?returnUrl=${encodeURIComponent(currentAppUrl + '/dashboard')}`;
        
        // Redirect to auth app
        window.location.href = loginUrl;
      }
    }
  }, [isAuthenticated, loading, router, user, message, setRedirectAfterLogin]);

  // Show loading state while checking auth
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      {loading ? 'Checking authentication status...' : 'Redirecting to login...'}
    </div>
  );
}