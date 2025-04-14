'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface KeySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function KeySelector({ value, onChange }: KeySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const musicalKeys = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-transparent text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
      >
        {value}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-24 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="max-h-[160px] overflow-y-auto py-2">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="p-2 bg-[#2C2C2E] text-white rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">Select key...</option>
              {musicalKeys.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
