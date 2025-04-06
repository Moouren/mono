'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState, useAuth, AuthService } from '@my-monorepo/shell';
import { App } from 'antd';

// URL of the auth app login page
const AUTH_APP_LOGIN_URL = `${process.env.NEXT_PUBLIC_AUTH_URL}/login`;

export default function Home() {
  const router = useRouter();
  const { message } = App.useApp();
  const { isAuthenticated, loading, user, ...rest } = useAuthState();
  const { setRedirectAfterLogin, setUser } = useAuth();
  
  console.log('Home component - Authentication state:', {isAuthenticated, user, loading});
  
  useEffect(() => {
    // First, check if there's a token in the URL
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('authToken');
    console.log('URL search params:', params.toString());
    console.log('Auth token present:', !!authToken);
    
    if (authToken) {
      try {
        console.log('Found auth token in URL, length:', authToken.length);
        console.log('First 50 chars:', authToken.substring(0, 50));
        
        // Decode the token data
        const decodedToken = decodeURIComponent(authToken);
        
        try {
          // Parse the token data
          const tokenData = JSON.parse(decodedToken);
          console.log('Token parsed successfully, contains:', {
            hasAccessToken: !!tokenData.accessToken,
            hasRefreshToken: !!tokenData.refreshToken,
            hasUserData: !!tokenData.userData
          });
          
          // Create auth service instance just for saving the token
          const tempAuthService = new AuthService(process.env.NEXT_PUBLIC_API_URL || '');
          
          // Save the token to cookie for this domain
          tempAuthService.saveTokensToStorage({
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            user: tokenData.userData || null
          });
          
          // If user data is included, set it in context
          if (tokenData.userData) {
            setUser(tokenData.userData);
          }
          
          // Clean the URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          console.log('Token saved, reloading page...');
          // Reload to apply auth state
          window.location.reload();
          return; // Exit early since we're reloading
        } catch (parseError) {
          console.error('Error parsing token JSON:', parseError);
          console.error('Token that failed to parse:', decodedToken.substring(0, 100) + '...');
          throw parseError;
        }
      } catch (error) {
        console.error('Failed to process auth token:', error);
        message.error('Authentication error');
      }
    }
    
    // Normal auth flow if no token in URL
    if (!loading) {
      if (isAuthenticated && user) {
        // User is authenticated, redirect to dashboard
        console.log('User is authenticated, redirecting to dashboard');
        router.push('/dashboard');
        message.success(`Welcome back, ${user.name}!`);
      } else {
        // User is not authenticated, save current app URL and redirect to login
        console.log('User is not authenticated, redirecting to login');
        const currentAppUrl = window.location.origin;
        
        // Store redirect URL before going to login page
        setRedirectAfterLogin(currentAppUrl + '/dashboard');
        
        // Add returnUrl parameter to help auth app know where to redirect back
        const loginUrl = `${AUTH_APP_LOGIN_URL}?returnUrl=${encodeURIComponent(currentAppUrl + '/dashboard')}`;
        
        console.log('Redirecting to login page:', loginUrl);
        // Redirect to auth app
        window.location.href = loginUrl;
      }
    }
  }, [isAuthenticated, loading, router, user, message, setRedirectAfterLogin, setUser]);

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