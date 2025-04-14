'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import SearchBox from '@/components/SearchBox';

export default function Home() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
      }
    };

    checkAuth();
  }, [supabase.auth, router]);

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <SearchBox />
      </div>
    </div>
  );
}
