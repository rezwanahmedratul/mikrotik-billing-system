import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MikroTik ISP Billing & Management',
  description: 'Multi-tenant ISP billing and MikroTik RouterOS operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-neutral-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
