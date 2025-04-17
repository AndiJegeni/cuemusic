'use client';

import Layout from '@/components/layout/Layout';
import { useEffect, useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Trash2 as TrashIcon } from 'lucide-react';
import { getAudioSource } from '@/utils/audio';

interface Sound {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags?: string[] | null;
  bpm?: number;
  key?: string;
  createdAt: string;
  duration?: number;
}

export default function Library() {
  const router = useRouter();
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingSound, setDeletingSound] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [soundDurations, setSoundDurations] = useState<{ [id: string]: number }>({});
  const [minDuration, setMinDuration] = useState<string>('');
  const [maxDuration, setMaxDuration] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }
      fetchSounds();
    };

    checkAuth();
  }, [supabase.auth, router]);

  const fetchSounds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/sounds');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch sounds');
      }
      const data = await response.json();
      const processedData = data.map((sound: Sound) => ({
        ...sound,
        tags: Array.isArray(sound.tags) ? sound.tags : []
      }));
      setSounds(processedData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sounds');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (soundId: string) => {
    try {
      setDeletingSound(soundId);
      const response = await fetch(`/api/sounds/${soundId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete sound');
      }

      setSounds(sounds.filter(sound => sound.id !== soundId));
      toast.success('Sound deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete sound');
    } finally {
      setDeletingSound(null);
    }
  };

  // Handler for single audio playback
  const handlePlay = (event: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const currentAudio = event.currentTarget;
    if (playingAudio && playingAudio !== currentAudio) {
      playingAudio.pause();
    }
    setPlayingAudio(currentAudio);
  };

  // Handler to get audio duration
  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLAudioElement, Event>, soundId: string) => {
    const duration = event.currentTarget.duration;
    // Only update state if duration is a valid, finite number
    if (duration && isFinite(duration)) {
      setSoundDurations(prev => ({
        ...prev,
        [soundId]: duration
      }));
    }
  };

  // Filter sounds based on duration
  const filteredSounds = sounds.filter(sound => {
    const duration = soundDurations[sound.id];
    // Ensure duration is a valid number before filtering
    if (duration === undefined || !isFinite(duration)) {
      // If no duration filter is set, include sounds with undefined/invalid duration
      return !minDuration && !maxDuration;
    }
    const min = minDuration ? parseFloat(minDuration) : 0;
    const max = maxDuration ? parseFloat(maxDuration) : Infinity;
    // Ensure min/max are valid numbers for comparison
    const validMin = isFinite(min) ? min : 0;
    const validMax = isFinite(max) ? max : Infinity;
    return duration >= validMin && duration <= validMax;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white">
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
            Your Library
          </h2>
          <p className="text-gray-400 mb-8">
            Manage your saved sounds and create new melodies
          </p>

          {/* Duration Filter Inputs */}
          <div className="mb-6 p-4 bg-[#1a1a1a] rounded-lg border border-gray-800 flex flex-col sm:flex-row gap-4 items-center">
            <span className="text-gray-300 font-medium whitespace-nowrap">Filter by Duration (s):</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <input 
                type="number" 
                placeholder="Min"
                value={minDuration}
                onChange={(e) => setMinDuration(e.target.value)}
                className="w-full sm:w-24 p-2 bg-[#2C2C2E] text-white rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                min="0"
              />
              <input 
                type="number" 
                placeholder="Max"
                value={maxDuration}
                onChange={(e) => setMaxDuration(e.target.value)}
                className="w-full sm:w-24 p-2 bg-[#2C2C2E] text-white rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                min="0"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-4 p-4">
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredSounds.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredSounds.map((sound) => (
                <div key={sound.id} className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-3 border border-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{sound.name}</h3>
                      {sound.tags && Array.isArray(sound.tags) && sound.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sound.tags.map((tag, index) => (
                            <span key={index} className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(sound.id)}
                      disabled={deletingSound === sound.id}
                      className="p-2 hover:bg-[#2C2C2E] rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    {sound.bpm && <p>BPM: {sound.bpm}</p>}
                    {sound.key && <p>Key: {sound.key}</p>}
                    <p>Added: {new Date(sound.createdAt).toLocaleDateString()}</p>
                  </div>
                  <audio 
                    controls 
                    className="w-full [&::-webkit-media-controls-panel]:bg-[#3C3C3E] [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
                    onPlay={handlePlay}
                    onLoadedMetadata={(e) => handleLoadedMetadata(e, sound.id)}
                    preload="metadata"
                  >
                    <source src={getAudioSource(sound.url)} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center">
              <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800">
                <p className="text-purple-400/80 mb-4">Your library is empty</p>
                <p className="text-gray-400 text-sm">Start by searching and saving some sounds!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
