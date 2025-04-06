'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Card, Form, Input, Typography, App, Spin } from 'antd';
import { useLogin, useAuth, useAuthState } from '@my-monorepo/shell';
import Link from 'next/link';

const { Title } = Typography;

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading } = useLogin();
  const { setRedirectAfterLogin } = useAuth();
  const { isAuthenticated, user } = useAuthState();
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  // Get return URL from query parameters if available
  const returnUrl = searchParams.get('returnUrl');
  const isLogout = searchParams.get('logout') === 'true';
  
  console.log('Login page - Auth state:', { isAuthenticated, user });
  console.log('Return URL:', returnUrl);
  
  // Handle logout if that's why we're here
  useEffect(() => {
    if (isLogout) {
      message.success('You have been logged out successfully');
    }
  }, [isLogout, message]);

  // Save return URL when component mounts
  useEffect(() => {
    if (returnUrl) {
      setRedirectAfterLogin(returnUrl);
      console.log('Stored return URL:', returnUrl);
    }
  }, [returnUrl, setRedirectAfterLogin]);

  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isRedirecting) {
      setIsRedirecting(true);
      console.log('User is authenticated, preparing redirect');

      // If return URL is provided, go there
      if (returnUrl) {
        // Check if this is a cross-domain redirect
        if (!returnUrl.startsWith(window.location.origin)) {
          try {
            // Create a token that contains minimal user info and tokens
            const tokenData = {
              accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.aStUV4tYyF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
              refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.bRtUV4sYoF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
              userData: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
              }
            };
            
            const encodedToken = encodeURIComponent(JSON.stringify(tokenData));
            console.log('Created token for redirect, length:', encodedToken.length);
            
            // Add the token to the return URL
            const separator = returnUrl.includes('?') ? '&' : '?';
            const redirectUrl = `${returnUrl}${separator}authToken=${encodedToken}`;
            
            console.log('Redirecting to:', redirectUrl.substring(0, 100) + '...');
            
            // Add small delay to ensure everything is ready
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);
          } catch (error) {
            console.error('Error during redirect:', error);
            message.error('Redirect failed');
            setIsRedirecting(false);
          }
        } else {
          // Same domain redirect
          setTimeout(() => {
            window.location.href = returnUrl;
          }, 500);
        }
      } else {
        // Otherwise go to the dashboard
        setTimeout(() => {
          router.push('/dashboard');
          setIsRedirecting(false);
        }, 500);
      }
    }
  }, [isAuthenticated, returnUrl, router, user, message, isRedirecting]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const response = await login(values);
      message.success('Login successful!');
      setIsRedirecting(true);
      
      // After successful login, handle redirect
      if (returnUrl) {
        // For cross-domain redirects, include token data
        if (!returnUrl.startsWith(window.location.origin)) {
          try {
            const tokenData = {
              accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.aStUV4tYyF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
              refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlNpbXVsYXRlZCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE3MDI1NTYwMDB9.bRtUV4sYoF0Wo0K7H8jQeW4LRC_4L4K15s5J-Bwz7WQ",
              userData: {
                id: response.user?.id || "12345",
                name: response.user?.name || values.email.split('@')[0],
                email: response.user?.email || values.email,
                role: response.user?.role || "user"
              }
            };
            
            const encodedToken = encodeURIComponent(JSON.stringify(tokenData));
            
            // Add authToken to the return URL
            const separator = returnUrl.includes('?') ? '&' : '?';
            const redirectUrl = `${returnUrl}${separator}authToken=${encodedToken}`;
            
            console.log('Redirecting after login to:', redirectUrl.substring(0, 100) + '...');
            
            // Add longer delay to ensure everything is ready
            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);
          } catch (error) {
            console.error('Error during redirect:', error);
            message.error('Redirect failed');
            setIsRedirecting(false);
          }
        } else {
          // Same domain redirect
          setTimeout(() => {
            window.location.href = returnUrl;
          }, 500);
        }
      } else {
        // Go to dashboard
        setTimeout(() => {
          router.push('/dashboard');
          setIsRedirecting(false);
        }, 500);
      }
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Login failed. Please try again.');
      }
      setIsRedirecting(false);
    }
  };

  if (isAuthenticated && !isLogout && !isRedirecting) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>You are already logged in. Redirecting...</div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Redirecting to application...</div>
      </div>
    );
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
          initialValues={{ email: 'user@example.com', password: 'password123' }}
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