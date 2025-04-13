'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const MUSICAL_KEYS = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 
  'F#', 'G', 'G#', 'A', 'A#', 'B'
];

interface KeySelectorProps {
  value: string;
  onChange: (key: string) => void;
}

export default function KeySelector({ value, onChange }: KeySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            {MUSICAL_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors cursor-pointer ${
                  key === value ? 'text-blue-500 font-medium' : 'text-gray-600'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
