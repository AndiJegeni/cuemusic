'use client';

import { Menu } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-[60px] border-b border-[#1A1A1A] flex items-center px-4">
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors">
          <Menu className="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </header>
  );
} 