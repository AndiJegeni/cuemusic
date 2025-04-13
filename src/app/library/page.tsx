'use client';

import { useEffect, useState } from 'react';
import { MelodyCard } from '@/types/melody';
import Library from '@/components/Library';

export default function LibraryPage() {
  const [melodies, setMelodies] = useState<MelodyCard[]>([]);

  // In a real app, we'd fetch this from an API or local storage
  useEffect(() => {
    // Mock data for demonstration
    setMelodies([
      { id: '1', title: 'test Melody', key: 'B', bpm: 105, duration: '0:43' },
      { id: '2', title: 'Summer Vibes', key: 'A', bpm: 128, duration: '1:15' },
      { id: '3', title: 'Chill Beat', key: 'F', bpm: 95, duration: '2:30' },
    ]);
  }, []);

  return (
    <main className="flex min-h-screen flex-col">
      <Library melodies={melodies} />
    </main>
  );
}
