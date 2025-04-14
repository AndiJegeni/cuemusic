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
  matchScore?: number; // Added for scoring
}

// Helper function to normalize words for better matching
function normalizeWord(word: string): string {
  // Convert to lowercase
  word = word.toLowerCase();
  
  // Basic stemming - remove common suffixes
  const suffixes = ['s', 'es', 'ing', 'ed'];
  for (const suffix of suffixes) {
    if (word.endsWith(suffix) && word.length > suffix.length + 2) {
      word = word.slice(0, -suffix.length);
      break;
    }
  }
  
  return word;
}

// Helper function to split text into normalized words
function splitIntoWords(text: string): string[] {
  return text
    .split(/[\s,]+/) // Split by spaces and commas
    .map(word => word.trim())
    .filter(word => word.length > 0)
    .map(normalizeWord);
}

// Helper function to calculate match score between search words and tags
function calculateMatchScore(tags: string[], searchWords: string[]): number {
  const tagWords = tags.flatMap(tag => splitIntoWords(tag));
  const uniqueTagWords = [...new Set(tagWords)]; // Remove duplicates
  
  // Count how many search words match any tag word exactly
  const exactMatches = searchWords.filter(searchWord => 
    uniqueTagWords.some(tagWord => tagWord === searchWord)
  ).length;
  
  // Count partial matches (but with lower weight)
  const partialMatches = searchWords.filter(searchWord => 
    uniqueTagWords.some(tagWord => tagWord.includes(searchWord) && tagWord !== searchWord)
  ).length;
  
  // Calculate score: exact matches are worth more than partial matches
  return (exactMatches * 2) + (partialMatches * 0.5);
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

    // Split query into words and normalize them
    const searchWords = splitIntoWords(query);

    // Filter sounds based on all criteria
    let filteredSounds = (allSounds as Sound[])?.filter(sound => {
      // Tag matching
      let matchesTags = true;
      if (query) {
        const tagsArray = typeof sound.tags === 'string' 
          ? sound.tags.split(',').map(tag => tag.trim())
          : Array.isArray(sound.tags) ? sound.tags : [];
        
        // Calculate match score
        const matchScore = calculateMatchScore(tagsArray, searchWords);
        sound.matchScore = matchScore;
        
        // Only include sounds that have at least one exact match
        matchesTags = matchScore >= 2; // At least one exact match (worth 2 points)
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

    // Sort results by match score (highest first)
    filteredSounds = filteredSounds.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    console.log('Found sounds:', filteredSounds);
    return NextResponse.json(filteredSounds);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search sounds' },
      { status: 500 }
    );
  }
} 