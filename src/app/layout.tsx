'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';

const inter = Inter({ subsets: ["latin"] });

// Dynamically import Sidebar with no SSR to avoid hydration issues
const Sidebar = dynamic(() => import('@/components/Sidebar'), { ssr: false });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1 bg-gray-50">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
