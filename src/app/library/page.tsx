'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Search, Plus, Trash2 } from 'lucide-react';

interface Sound {
  id: string;
  name: string;
  url: string;
  tags: string[] | string;
  bpm?: number;
  key?: string;
  createdAt: string;
}

export default function LibraryPage() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchSounds();
  }, [router, supabase.auth]);

  const fetchSounds = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push('/signin');
        return;
      }

      const response = await fetch('/api/sounds');
      if (!response.ok) {
        throw new Error('Failed to fetch sounds');
      }

      const data = await response.json();
      setSounds(data);
    } catch (err) {
      console.error('Error fetching sounds:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sounds');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (soundId: string) => {
    try {
      const response = await fetch(`/api/sounds/${soundId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sound');
      }

      setSounds(prevSounds => prevSounds.filter(sound => sound.id !== soundId));
    } catch (err) {
      console.error('Error deleting sound:', err);
    }
  };

  const filteredSounds = sounds.filter(sound => 
    sound.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (Array.isArray(sound.tags) && sound.tags.some(tag => 
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Loading sounds...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sound Library</h1>
          <p className="text-gray-600">Manage and organize your sound collection.</p>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search sounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add New Sound
          </button>
        </div>
        
        {filteredSounds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSounds.map((sound) => (
              <div key={sound.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{sound.name}</h3>
                    <div className="flex gap-3 text-sm text-gray-500 mt-1">
                      {sound.bpm && (
                        <span className="flex items-center">
                          <span className="font-medium">{sound.bpm}</span>
                          <span className="ml-1">BPM</span>
                        </span>
                      )}
                      {sound.key && (
                        <span className="flex items-center">
                          <span className="font-medium">{sound.key}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(sound.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(sound.tags) && sound.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <audio 
                  controls 
                  className="w-full [&::-webkit-media-controls-panel]:bg-gray-50"
                >
                  <source src={sound.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-600">
              {searchQuery ? 'No sounds match your search.' : 'Your collection is empty. Add some sounds to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
