'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useEffect, useState } from 'react';
import SearchBox from '@/components/SearchBox';
import type { SoundLibrary, Sound } from "@/types/prisma";
import { useRouter } from 'next/navigation';

type LibraryWithSounds = SoundLibrary & {
  sounds: Sound[];
};

export default function Home() {
  const [libraries, setLibraries] = useState<LibraryWithSounds[]>([]);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        router.push('/signin');
        return;
      }

      // Fetch libraries from API route
      const response = await fetch('/api/libraries');
      if (response.ok) {
        const data = await response.json();
        setLibraries(data);
      }
    };

    checkSession();
  }, [supabase.auth, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <SearchBox />
        </div>
        
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Your Sound Libraries</h1>
          <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            Create New Library
          </button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {libraries.map((library: LibraryWithSounds) => (
            <div
              key={library.id}
              className="overflow-hidden rounded-lg bg-white shadow"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {library.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {library.sounds.length} sounds
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
