'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'react-hot-toast';
import { getAudioSource } from '@/utils/audio';

interface Sound {
  id: string;
  name: string;
  url: string;
  tags: string[] | string;
  bpm?: number;
  key?: string;
}

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [bpm, setBpm] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="max-w-2xl mx-auto p-4 bg-[#1C1C1E]">
      <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-purple-600 text-transparent bg-clip-text">
        Find your perfect sound
      </h2>
      <p className="text-gray-400 mb-8">
        Search through our curated collection of sounds based on your project's needs
      </p>

      <form onSubmit={handleSearch} className="mb-8 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. find a sound that resembles street lights at night"
            className="flex-1 p-3 rounded-lg bg-[#2C2C2E] text-white placeholder:italic placeholder:text-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-lg"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#8B5CF6] text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200 shadow-lg shadow-purple-500/20"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors duration-200"
          >
            <span>{showAdvanced ? 'Hide Advanced Search' : 'Show Advanced Search'}</span>
            <svg 
              className={`w-4 h-4 transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-2 gap-4 p-6 bg-[#2C2C2E] rounded-lg shadow-xl">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                BPM
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="Enter BPM..."
                className="w-full p-3 rounded-lg bg-[#3C3C3E] text-white placeholder:text-gray-500 border-0 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                min="0"
                max="300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#3C3C3E] text-white border-0 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Select key...</option>
                {musicalKeys.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {saveError && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveError.includes('successfully') 
            ? 'bg-green-900/20 border border-green-500/20 text-green-400'
            : 'bg-red-900/20 border border-red-500/20 text-red-400'
        }`}>
          {saveError}
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-6">
          {results.map((sound) => (
            <div key={sound.id} className="bg-[#2C2C2E] p-6 rounded-lg shadow-xl">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-white">{sound.name}</h3>
                <button
                  onClick={() => handleSaveSound(sound.id)}
                  disabled={savingSound === sound.id}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {savingSound === sound.id ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
              <div className="text-sm text-gray-400 space-y-1 mb-4">
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
          <div className="text-center text-purple-400/80 p-8">
            We're working on adding more sounds. In the meantime, try another search.
          </div>
        )
      )}
    </div>
  );
}
