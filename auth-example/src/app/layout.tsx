'use client';

import { AuthProvider, AuthService, RtlProvider } from '@my-monorepo/shell';
import { Inter } from 'next/font/google';
import { App as AntApp } from 'antd';
import 'antd/dist/reset.css';

const inter = Inter({ subsets: ['latin'] });

// Initialize auth service
const authService = new AuthService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="rtl">
      <body className={inter.className}>
        <RtlProvider theme={{ colorPrimary: '#1890ff' }}>
          <AntApp>
            <AuthProvider authService={authService}>
              {children}
            </AuthProvider>
          </AntApp>
        </RtlProvider>
      </body>
    </html>
  );
}