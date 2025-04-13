import { createBrowserClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Search sounds where tags array contains the query
    const { data: sounds, error } = await supabase
      .from('sounds')
      .select('*')
      .contains('tags', [query]);

    if (error) throw error;

    return NextResponse.json(sounds);
  } catch (error) {
    console.error('Error searching sounds:', error);
    return NextResponse.json(
      { error: 'Failed to search sounds' },
      { status: 500 }
    );
  }
} 