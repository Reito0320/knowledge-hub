import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/comp/Header';
import AmplifyProvider from '@/comp/AmplifyProvider';
import ToastProvider from '@/comp/ToastProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Knowledge-Hub',
  description: '社内の知識と、詳しいメンバーが見つかる情報共有ツール',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AmplifyProvider>
          <Header />
          {children}
          <ToastProvider />
        </AmplifyProvider>
      </body>
    </html>
  );
}
