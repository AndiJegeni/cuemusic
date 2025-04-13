import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface Sound {
  id: string;
  name: string;
  url: string;
  tags: string[] | string;
  bpm?: number;
  key?: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';
  const bpm = searchParams.get('bpm');
  const key = searchParams.get('key');

  console.log('Search params:', { query, bpm, key });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // Get all sounds and filter them in memory
    const { data: allSounds, error } = await supabase
      .from('sounds')
      .select('*');

    if (error) {
      console.error('Supabase search error:', error);
      throw error;
    }

    // Filter sounds based on all criteria
    const filteredSounds = (allSounds as Sound[])?.filter(sound => {
      // Tag matching
      let matchesTags = true;
      if (query) {
        const tagsArray = typeof sound.tags === 'string' 
          ? sound.tags.split(',').map(tag => tag.trim())
          : Array.isArray(sound.tags) ? sound.tags : [];
        
        matchesTags = tagsArray.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        );
      }

      // BPM matching (with small tolerance)
      let matchesBpm = true;
      if (bpm && sound.bpm) {
        const targetBpm = parseInt(bpm);
        const tolerance = 5; // Allow ±5 BPM
        matchesBpm = Math.abs(sound.bpm - targetBpm) <= tolerance;
      }

      // Key matching
      let matchesKey = true;
      if (key && sound.key) {
        matchesKey = sound.key.toLowerCase() === key.toLowerCase();
      }

      return matchesTags && matchesBpm && matchesKey;
    }) || [];

    console.log('Found sounds:', filteredSounds);
    return NextResponse.json(filteredSounds);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search sounds', details: error },
      { status: 500 }
    );
  }
} 