'use client';

import { MelodyCard as MelodyCardType } from '@/types/melody';
import MelodyCard from './MelodyCard';

interface LibraryProps {
  melodies: MelodyCardType[];
}

export default function Library({ melodies }: LibraryProps) {
  return (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-6">Library</h2>
      <div className="flex flex-col gap-2">
        {melodies.map((melody) => (
          <MelodyCard key={melody.id} melody={melody} />
        ))}
      </div>
    </div>
  );
}
