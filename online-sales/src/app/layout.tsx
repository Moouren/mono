// apps/online-sales/app/layout.tsx
'use client';

import { AuthProvider, AuthService, RtlProvider } from '@my-monorepo/shell';
import { Roboto } from 'next/font/google';
import { App as AntApp } from 'antd';
import 'antd/dist/reset.css';

const roboto = Roboto({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'] 
});

// Initialize auth service with the same API endpoint
const authService = new AuthService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="rtl">
      <body className={roboto.className}>
        <RtlProvider theme={{ colorPrimary: '#52c41a' }}>
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