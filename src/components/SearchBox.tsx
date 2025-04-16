'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import { Settings, Send, Search } from 'lucide-react';
import { getAudioSource } from '@/utils/audio';
import KeySelector from './KeySelector';
import { cn } from '@/lib/utils';

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

  const handleSaveSound = async (sound: Sound) => {
    try {
      setSavingSound(sound.id);
      const response = await fetch('/api/sounds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sound.name,
          url: sound.url,
          tags: Array.isArray(sound.tags) ? sound.tags : sound.tags?.split(',').map(t => t.trim()) || [],
          bpm: sound.bpm,
          key: sound.key
        }),
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
    <div className="max-w-2xl mx-auto">
      <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
        Find your perfect sound
      </h2>
      <p className="text-gray-400 mb-8">
        Search the vibe not the tag
      </p>

      <div className="relative w-full">
        <div className="rounded-xl border border-zinc-700 shadow-lg bg-[#1A1A1A]">
          <div className="relative flex items-center">
            <Search className="absolute left-4 text-gray-400 h-5 w-5" />
            <input
              type="text"
              className="w-full bg-transparent text-foreground rounded-xl h-[52px] pl-12 pr-24 placeholder:text-muted-foreground focus:outline-none"
              placeholder="Find a sound that resembles street lights at night..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="absolute right-3 flex gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={handleSearch}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 transition-colors p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="absolute w-full mt-2 p-4 bg-[#1A1A1A] rounded-xl border border-zinc-700 z-10">
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
        )}
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
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      ) : results.length > 0 ? (
        <div className="mt-4 space-y-4">
          {results.map((sound) => (
            <div key={sound.id} className="bg-[#1a1a1a] rounded-2xl p-4 flex flex-col gap-3 border border-gray-800">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-white">{sound.name}</h3>
                <button
                  onClick={() => handleSaveSound(sound)}
                  disabled={savingSound === sound.id}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {savingSound === sound.id ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
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
