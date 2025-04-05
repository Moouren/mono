// apps/online-sales/app/layout.tsx
// Similar approach for the online-sales app
// Not marking the entire file as 'use client'
'use client'
import { Roboto } from 'next/font/google';
import 'antd/dist/reset.css';
import dynamic from 'next/dynamic';

// Import client-side only components with dynamic imports
const ClientSideProviders = dynamic(
  () => import('./client-provider'),
  { ssr: false }
);

const roboto = Roboto({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'] 
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="rtl">
      <body className={roboto.className}>
        <ClientSideProviders>
          {children}
        </ClientSideProviders>
      </body>
    </html>
  );
}
