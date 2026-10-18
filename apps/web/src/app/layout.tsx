import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'MikroTik ISP Billing & Management',
  description: 'Carrier-grade multi-tenant ISP billing and MikroTik RouterOS operations platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
