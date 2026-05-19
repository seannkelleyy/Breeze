import type { Metadata } from 'next';
import { Geist, Geist_Mono, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Providers from './providers';
import { Navigation } from '@/components/common/navigation/index';
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Breeze',
  description: 'Breeze, the personal finance planner.',
};

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key');
}

export const dynamic = 'force-dynamic';
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        inter.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
