'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          "bg-[#2C2C2E] text-white hover:bg-[#3C3C3E]",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        )}
      >
        <span className="text-sm font-medium">{value || 'Select key...'}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-32 bg-[#1A1A1A] rounded-xl shadow-lg border border-zinc-700 z-50 overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto py-2">
            {musicalKeys.map((key) => (
              <button
                key={key}
                onClick={() => {
                  onChange(key);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-[#2C2C2E] text-white",
                  value === key && "bg-purple-600/20 text-purple-400"
                )}
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
