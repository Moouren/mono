// apps/auth-example/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
  console.log('isAu',isAuthenticated,rest)
  // Get return URL from query parameters if available
  const returnUrl = searchParams.get('returnUrl');
  console.log('rees',isAuthenticated,rest)
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // If return URL is provided, go there
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        // Otherwise go to the dashboard
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, returnUrl, router]);

  // Save return URL when component mounts
  useEffect(() => {
    if (returnUrl) {
      setRedirectAfterLogin(returnUrl);
    }
  }, [returnUrl, setRedirectAfterLogin]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      await login(values);
      message.success('Login successful!');
      
      // After successful login, redirect to the stored URL or dashboard
      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
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

  if (isAuthenticated) {
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