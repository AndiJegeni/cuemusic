'use client';

import { Play, Heart } from 'lucide-react';
import { MelodyCard as MelodyCardType } from '@/types/melody';

interface MelodyCardProps {
  melody: MelodyCardType;
}

export default function MelodyCard({ melody }: MelodyCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white hover:bg-blue-600 transition-colors">
            <Play className="w-3 h-3" />
          </button>
          <span className="text-base font-medium text-gray-900">{melody.title}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>♪ {melody.key}</span>
            <span>{melody.bpm} BPM</span>
          </div>
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <Heart className={`w-5 h-5 ${melody.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="w-full h-1.5 bg-gray-100 rounded-full">
            <div className="w-1/3 h-full bg-blue-500 rounded-full"></div>
          </div>
        </div>
        <span className="text-sm text-gray-500 min-w-[48px] text-right">{melody.duration}</span>
      </div>
    </div>
  );
}
