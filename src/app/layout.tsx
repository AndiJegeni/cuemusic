import { Inter } from 'next/font/google';
import { LayoutContent } from '@/components/LayoutContent';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Cue Music',
  description: 'Your personal sound library',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} bg-[#121214] text-purple-400 min-h-screen`}>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
