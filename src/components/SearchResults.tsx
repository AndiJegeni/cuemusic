'use client';

import { MelodyCard as MelodyCardType } from '@/types/melody';
import MelodyCard from './MelodyCard';

interface SearchResultsProps {
  results: MelodyCardType[];
}

export default function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="flex flex-col gap-2 mt-2">
      {results.map((melody) => (
        <MelodyCard key={melody.id} melody={melody} />
      ))}
    </div>
  );
}
