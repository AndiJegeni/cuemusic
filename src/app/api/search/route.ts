import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Stripe as StripeType } from 'stripe';

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

// Function to generate Stripe Checkout URL
async function generateStripeCheckoutUrl(userId: string): Promise<string> {
  // Initialize Stripe inside the function
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-03-31.basil',
  }) as StripeType;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRICE_ID!,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/cancel`,
    metadata: { userId },
  });
  return session.url!;
}

export async function GET(request: Request) {
  // Log environment variables inside the handler
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

  // Get the user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session error:', sessionError);
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 });
  }

  if (!session) {
    // Handle unauthenticated users if necessary, or return an error
    // For now, let's assume search requires authentication
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }

  const userId = session.user.id; // Use the actual user ID from the session

  // Fetch user data (search_count, is_premium)
  let { data: userData, error: userError } = await supabase
    .from('users')
    .select('search_count, is_premium')
    .eq('id', userId)
    .single();

  if (userError) {
    if (userError.code === 'PGRST116') { 
      console.warn(`User record not found for ID: ${userId}. Assuming 0 searches and not premium.`);
      userData = { search_count: 0, is_premium: false }; 
    } else {
      console.error('User fetch error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
  }

  // Ensure userData is not null before proceeding
  if (!userData) {
    console.error('User data is null after fetch and error handling');
    return NextResponse.json({ error: 'Failed to process user data' }, { status: 500 });
  }

  // Check search count and premium status
  if (userData.is_premium || userData.search_count < 15) {
    // Increment search count only if the user is not premium
    if (!userData.is_premium) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ search_count: userData.search_count + 1 })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update search count:', updateError);
      }
    }

    // Proceed with search logic
    try {
      const { data: allSounds, error } = await supabase
        .from('sounds')
        .select('*');

      if (error) {
        console.error('Supabase search error:', error);
        throw error;
      }

      const searchWords = splitIntoWords(query);

      let filteredSounds = (allSounds as Sound[])?.filter(sound => {
        let matchesTags = true;
        if (query) {
          const tagsArray = typeof sound.tags === 'string' 
            ? sound.tags.split(',').map(tag => tag.trim())
            : Array.isArray(sound.tags) ? sound.tags : [];
          
          const matchScore = calculateMatchScore(tagsArray, searchWords);
          sound.matchScore = matchScore;
          matchesTags = matchScore >= 2; 
        }

        let matchesBpm = true;
        if (bpm && sound.bpm) {
          const targetBpm = parseInt(bpm);
          const tolerance = 5; 
          matchesBpm = Math.abs(sound.bpm - targetBpm) <= tolerance;
        }

        let matchesKey = true;
        if (key && sound.key) {
          matchesKey = sound.key.toLowerCase() === key.toLowerCase();
        }

        return matchesTags && matchesBpm && matchesKey;
      }) || [];

      filteredSounds = filteredSounds.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      console.log('Found sounds:', filteredSounds.length);
      return NextResponse.json(filteredSounds);
    } catch (error) {
      console.error('Search error:', error);
      return NextResponse.json(
        { error: 'Failed to search sounds' },
        { status: 500 }
      );
    }
  } else {
    // User has reached the search limit
    const checkoutUrl = await generateStripeCheckoutUrl(userId);
    return NextResponse.json({ message: 'Upgrade to Premium', checkoutUrl });
  }
} 