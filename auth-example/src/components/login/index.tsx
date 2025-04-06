'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Form, Input, Typography, App } from 'antd';
import { useLogin, useAuth, useAuthState } from '@my-monorepo/shell';
import Link from 'next/link';

const { Title } = Typography;

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading } = useLogin();
  const { setRedirectAfterLogin } = useAuth();
  const { isAuthenticated, ...rest } = useAuthState();
  const [form] = Form.useForm();
  const { message } = App.useApp();
  
  // Get return URL from query parameters if available
  const returnUrl = searchParams.get('returnUrl');
  const isLogout = searchParams.get('logout') === 'true';
  
  console.log('Authentication state:', isAuthenticated, rest);
  console.log('Return URL:', returnUrl);
  
  // Handle logout if that's why we're here
  useEffect(() => {
    if (isLogout) {
      message.success('You have been logged out successfully');
    }
  }, [isLogout, message]);

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If return URL is provided, go there
      if (returnUrl) {
        // Check if this is a cross-domain redirect
        if (!returnUrl.startsWith(window.location.origin)) {
          // For cross-domain redirects, we need to include the auth token
          const state = rest.state;
          console.log('Authentication state for redirect:', state ? 'STATE EXISTS' : 'NO STATE');
          
          if (state && state.accessToken && state.refreshToken) {
            // CRITICAL: Log what's actually in the state
            console.log('Token data available:', {
              accessTokenLength: state.accessToken.length,
              refreshTokenLength: state.refreshToken.length,
              hasUser: !!state.user
            });
            
            try {
              // Include tokens and minimal user data
              const tokenData = encodeURIComponent(JSON.stringify({
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                // Include minimal user data - IMPORTANT for your current setup
                userData: state.user ? {
                  id: state.user.id,
                  name: state.user.name,
                  email: state.user.email,
                  role: state.user.role
                } : null
              }));
              
              console.log('Created token for redirect, length:', tokenData.length);
              
              // IMPORTANT: Use the home route instead of dashboard directly
              // This allows your token-handling logic in Home component to run
              const baseUrl = returnUrl.split('/dashboard')[0]; // Get base URL without /dashboard
              const separator = baseUrl.includes('?') ? '&' : '?';
              const redirectUrl = `${baseUrl}${separator}authToken=${tokenData}`;
              
              console.log('Redirecting to:', redirectUrl.substring(0, 100) + '...');
              
              // Add a small delay to ensure the log is visible and cookies are set
              setTimeout(() => {
                window.location.href = redirectUrl;
              }, 500);
              
              return; // Important: prevent further execution
            } catch (error) {
              console.error('Error creating redirect token:', error);
            }
          } else {
            console.warn('Missing tokens in state for redirect');
          }
          
          // Fallback - redirect without token (still try to go to home rather than dashboard)
          const baseUrl = returnUrl.split('/dashboard')[0];
          console.warn('Redirect fallback - no token available, going to:', baseUrl);
          window.location.href = baseUrl;
        } else {
          // Same domain redirect
          window.location.href = returnUrl;
        }
      } else {
        // Otherwise go to the dashboard
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, returnUrl, router, rest]);

  // Save return URL when component mounts
  useEffect(() => {
    if (returnUrl) {
      setRedirectAfterLogin(returnUrl);
    }
  }, [returnUrl, setRedirectAfterLogin]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const response = await login(values);
      message.success('Login successful!');
      
      // After successful login, check if returnUrl is cross-domain
      if (returnUrl) {
        if (!returnUrl.startsWith(window.location.origin)) {
          console.log('Login successful, preparing cross-domain redirect');
          console.log('Login response contains tokens:', {
            hasAccessToken: !!response.accessToken,
            hasRefreshToken: !!response.refreshToken,
            hasUser: !!response.user
          });
          
          // For cross-domain redirects, use minimal token data but include basic user info
          const tokenData = encodeURIComponent(JSON.stringify({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            userData: response.user ? {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              role: response.user.role
            } : null
          }));
          
          console.log('Created token for redirect, length:', tokenData.length);
          
          // IMPORTANT: Redirect to home page instead of dashboard directly
          const baseUrl = returnUrl.split('/dashboard')[0]; // Get base URL without /dashboard
          const separator = baseUrl.includes('?') ? '&' : '?';
          const redirectUrl = `${baseUrl}${separator}authToken=${tokenData}`;
          
          console.log('Redirecting to:', redirectUrl.substring(0, 100) + '...');
          
          // Add small delay to ensure cookies are set
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 500);
          
          return; // Important: prevent further execution
        } else {
          // Same domain redirect
          window.location.href = returnUrl;
        }
      } else {
        // Go to dashboard
        router.push('/dashboard');
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Login failed. Please try again.');
      }
    }
  };

  if (isAuthenticated && !isLogout) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh' 
    }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 20 }}>
          Login
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ width: '100%' }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link href="/register">
            Don't have an account? Register
          </Link>
        </div>
        
        {returnUrl && (
          <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.9em', color: '#666' }}>
            You'll be redirected back to your application after login.
          </div>
        )}
      </Card>
    </div>
  );
}