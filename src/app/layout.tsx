'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from '@/components/Sidebar';
import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Head from 'next/head';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (!session && pathname !== '/signin') {
        router.push('/signin');
      } else if (session && pathname === '/signin') {
        router.push('/');
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session && pathname !== '/signin') {
        router.push('/signin');
      } else if (session && pathname === '/signin') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router, pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/signin');
  };

  // Only show the layout with Sidebar and profile when signed in
  if (!session && pathname === '/signin') {
    return (
      <html lang="en" className="bg-[#121214]">
        <head>
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/icon.svg" type="image/svg+xml" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        </head>
        <body className={`${inter.className} bg-[#121214] text-purple-400`}>
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="bg-[#121214]">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} bg-[#121214] text-purple-400`}>
        <div className="flex h-screen">
          <Sidebar />
          <div className="flex-1">
            <div className="flex justify-between items-center p-4 bg-[#1C1C1E] shadow-lg">
              <div className="flex items-center space-x-4">
                {session?.user && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                        {session.user.email?.[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-purple-300">
                        {session.user.email}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="btn-secondary text-sm"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-6">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
