'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import { Settings, Send } from 'lucide-react';
import { getAudioSource } from '@/utils/audio';
import KeySelector from './KeySelector';

interface Sound {
  id: string;
  name: string;
  url: string;
  tags: string[] | string;
  bpm?: number;
  key?: string;
}

export default function SearchBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [bpm, setBpm] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingSound, setSavingSound] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Musical keys for dropdown
  const musicalKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];

  // Helper function to format tags for display
  const formatTags = (tags: string[] | string | null): string => {
    if (!tags) return 'No tags';
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).join(', ');
    }
    if (Array.isArray(tags)) {
      return tags.join(', ');
    }
    return 'No tags';
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() && !bpm && !key) return;

    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      if (query.trim()) searchParams.append('q', query);
      if (bpm) searchParams.append('bpm', bpm);
      if (key) searchParams.append('key', key);

      const response = await fetch(`/api/search?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to search sounds');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search sounds');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSound = async (soundId: string) => {
    try {
      setSavingSound(soundId);
      const response = await fetch('/api/sounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ soundId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to save sound');
      }

      toast.success('Sound saved to library!');
      setSavingSound(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save sound');
      setSavingSound(null);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [query, bpm, key]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
        Find your perfect sound
      </h2>
      <p className="text-gray-400 mb-8">
        Search through our curated collection of sounds based on your project's needs
      </p>

      <div className={`bg-[#1a1a1a] rounded-2xl shadow-lg border border-gray-800 transition-all duration-200 ${isExpanded ? 'h-[120px]' : 'h-[60px]'}`}>
        <div className="flex items-center gap-2 px-6 h-[60px]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. find a sound that resembles street lights at night"
            className="flex-1 bg-transparent text-base text-gray-100 placeholder-gray-500 outline-none"
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSearch}
            disabled={loading}
            className={`p-2 text-gray-400 hover:text-gray-200 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        <div className={`px-6 pb-6 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-8">
            <div className="flex-1 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-300">BPM</span>
              <div className="flex-1">
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="Enter BPM..."
                  className="w-full p-2 bg-[#2C2C2E] text-white rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  min="0"
                  max="300"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-300">Key</span>
              <KeySelector value={key} onChange={setKey} />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {saveError && (
        <div className={`mt-4 p-4 rounded-lg ${
          saveError.includes('successfully') 
            ? 'bg-green-900/20 border border-green-500/20 text-green-400'
            : 'bg-red-900/20 border border-red-500/20 text-red-400'
        }`}>
          {saveError}
        </div>
      )}

      {loading && (
        <div className="mt-4 p-4">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 ? (
        <div className="mt-4 space-y-4">
          {results.map((sound) => (
            <div key={sound.id} className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-3 border border-gray-800">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-white">{sound.name}</h3>
                <button
                  onClick={() => handleSaveSound(sound.id)}
                  disabled={savingSound === sound.id}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {savingSound === sound.id ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <p>Tags: {formatTags(sound.tags)}</p>
                {sound.bpm && <p>BPM: {sound.bpm}</p>}
                {sound.key && <p>Key: {sound.key}</p>}
              </div>
              <audio 
                controls 
                className="w-full [&::-webkit-media-controls-panel]:bg-[#3C3C3E] [&::-webkit-media-controls-current-time-display]:text-white [&::-webkit-media-controls-time-remaining-display]:text-white"
              >
                <source src={getAudioSource(sound.url)} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          ))}
        </div>
      ) : (
        !loading && (query || bpm || key) && (
          <div className="mt-4 text-center text-purple-400/80 p-8">
            We're working on adding more sounds. In the meantime, try another search.
          </div>
        )
      )}
    </div>
  );
}
