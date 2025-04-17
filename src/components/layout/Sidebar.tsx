'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Library, LogOut, LogIn, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Create library for user if they don't have one
        await fetch('/api/library', { method: 'POST' });
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetch('/api/library', { method: 'POST' });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      router.push('/');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      current: pathname === '/'
    },
    {
      name: 'Library',
      href: '/library',
      icon: Library,
      current: pathname === '/library'
    }
  ];

  return (
    <div
      className={cn(
        'relative flex h-full flex-col bg-[#0A0A0A] border-r border-[#1A1A1A] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-3 right-[-12px] z-10 p-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full text-gray-400 hover:text-white hover:bg-[#2C2C2E] transition-colors"
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="flex h-[60px] items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
            Cue
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              item.current
                ? 'bg-purple-600/10 text-purple-500'
                : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'
            )}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>

      <div className="flex h-[60px] items-center justify-between px-4 border-t border-[#1A1A1A]">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium">
                {user?.email ? user.email[0].toUpperCase() : 'G'}
              </div>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    {user?.email ? user.email.split('@')[0] : 'Guest'}
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50"
              >
                <LogOut className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-2 text-sm font-medium",
              collapsed ? "justify-center p-2" : "w-full justify-center p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            )}
          >
            <LogIn className="h-5 w-5" />
            {!collapsed && <span>Sign in</span>}
          </button>
        )}
      </div>
    </div>
  );
} 