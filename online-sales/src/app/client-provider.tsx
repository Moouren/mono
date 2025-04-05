
// apps/online-sales/app/client-providers.tsx
'use client';

import { AuthProvider, AuthService, RtlProvider } from '@my-monorepo/shell';
import { App as AntApp } from 'antd';
import { ReactNode } from 'react';

// Initialize auth service with the same API endpoint
const authService = new AuthService(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api');

// Client-side only providers
export default function ClientSideProviders({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <RtlProvider theme={{ colorPrimary: '#52c41a' }}>
      <AntApp>
        <AuthProvider authService={authService}>
          {children}
        </AuthProvider>
      </AntApp>
    </RtlProvider>
  );
}