'use client';

import { useState } from 'react';
import { Settings, Send } from 'lucide-react';
import KeySelector from './KeySelector';
import SearchResults from './SearchResults';
import { MelodyCard } from '@/types/melody';

export default function SearchBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [key, setKey] = useState('C');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MelodyCard[] | null>(null);
  
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    // Mock data for demonstration
    const results = [
      { id: '1', title: 'test Melody', key: 'B', bpm: 105, duration: '0:43' },
      { id: '2', title: 'Summer Vibes', key: 'A', bpm: 128, duration: '1:15' },
      { id: '3', title: 'Chill Beat', key: 'F', bpm: 95, duration: '2:30' },
    ];
    
    setSearchResults(results);
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm transition-all duration-200 ${isExpanded ? 'h-[120px]' : 'h-[60px]'}`}>
      <div className="flex items-center gap-2 px-6 h-[60px]">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for your perfect sound"
          className="flex-1 bg-transparent text-base text-gray-600 placeholder-gray-400 outline-none"
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button 
          onClick={handleSearch}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      <div className={`px-6 pb-6 transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-8">
          <div className="flex-1 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">BPM</span>
            <div className="flex-1">
              <input
                type="range"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <span className="text-sm font-medium text-gray-600">{bpm}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">Key</span>
            <KeySelector value={key} onChange={setKey} />
          </div>
        </div>
      </div>
      
      {searchResults && <SearchResults results={searchResults} />}
    </div>
  );
}
