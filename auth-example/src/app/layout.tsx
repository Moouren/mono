// apps/auth-example/app/layout.tsx
// Not marking the entire file as 'use client' since we want to support SSR
'use client'
import { Inter } from 'next/font/google';
import 'antd/dist/reset.css';
import dynamic from 'next/dynamic';

// Import client-side only components with dynamic imports
const ClientSideProviders = dynamic(
  () => import('./client-provider'),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="rtl">
      <body className={inter.className}>
        <ClientSideProviders>
          {children}
        </ClientSideProviders>
      </body>
    </html>
  );
}


