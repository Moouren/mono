'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState, useAuth, AuthService } from '@my-monorepo/shell';
import { App, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// URL of the auth app login page
const AUTH_APP_LOGIN_URL = `${process.env.NEXT_PUBLIC_AUTH_URL}/login`;

export default function Home() {
  const router = useRouter();
  const { message } = App.useApp();
  const { isAuthenticated, user, loading } = useAuthState();
  const { setRedirectAfterLogin, setUser } = useAuth();
  const [processingToken, setProcessingToken] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  console.log('Home component - Authentication state:', { isAuthenticated, user, loading });
  
  useEffect(() => {
    // First, check if there's a token in the URL
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('authToken');
    console.log('URL search params:', params.toString());
    console.log('Auth token present:', !!authToken);
    
    if (authToken) {
      setProcessingToken(true);
      try {
        console.log('Found auth token in URL, processing...');
        
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
          
          // Create auth service instance with appropriate API URL
          const tempAuthService = new AuthService(process.env.NEXT_PUBLIC_API_URL || '');
          
          // Create AuthResponse structure expected by saveTokensToStorage
          const authResponse = {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            user: tokenData.userData || null
          };
          
          // Save tokens with cross-domain support
          tempAuthService.saveTokensToStorage(authResponse);
          
          // If user data is included, update context
          if (tokenData.userData) {
            setUser(tokenData.userData);
          }
          
          // Clean the URL
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          
          console.log('Token saved successfully, waiting to redirect...');
          
          // Add a small delay to ensure tokens are saved properly
          setTimeout(() => {
            router.push('/dashboard');
            setProcessingToken(false);
          }, 1500);
          
          return; // Exit early to prevent the other logic from executing
        } catch (parseError) {
          console.error('Error parsing token JSON:', parseError);
          console.error('Token that failed to parse:', decodedToken.substring(0, 100) + '...');
          setProcessingToken(false);
          setRedirectAttempted(true);
          throw parseError;
        }
      } catch (error) {
        console.error('Failed to process auth token:', error);
        message.error('Authentication error');
        setProcessingToken(false);
        setRedirectAttempted(true);
      }
    } else if (!loading && !redirectAttempted) {
      // Normal auth flow if no token in URL and not still loading
      if (isAuthenticated && user) {
        // User is authenticated, redirect to dashboard
        console.log('User is authenticated, redirecting to dashboard');
        router.push('/dashboard');
        message.success(`Welcome back, ${user.name}!`);
      } else {
        // User is not authenticated, save current app URL and redirect to login
        console.log('User is not authenticated, redirecting to login');
        setRedirectAttempted(true);
        const currentAppUrl = window.location.origin;
        
        // Store redirect URL before going to login page
        setRedirectAfterLogin(currentAppUrl);
        
        // Add returnUrl parameter to help auth app know where to redirect back
        const loginUrl = `${AUTH_APP_LOGIN_URL}?returnUrl=${encodeURIComponent(currentAppUrl)}`;
        
        console.log('Redirecting to login page:', loginUrl);
        // Redirect to auth app after short delay
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 500);
      }
    }
  }, [isAuthenticated, loading, router, user, message, setRedirectAfterLogin, setUser, redirectAttempted]);

  // Show loading state
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      <div style={{ marginTop: 16 }}>
        {processingToken ? 'Processing authentication...' : 
         loading ? 'Checking authentication status...' : 
         'Redirecting to login...'}
      </div>
    </div>
  );
}