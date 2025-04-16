import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface Sound {
  id: string;
  name: string;
  audio_url: string;
  description?: string;
  tags: { name: string }[];
  bpm?: number;
  key?: string;
}

export async function GET(request: Request) {
  try {
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

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sounds, error } = await supabase
      .from('sounds')
      .select('*')
      .eq('user_id', session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the client-side interface
    const transformedSounds = sounds.map((sound: Sound) => ({
      id: sound.id,
      name: sound.name,
      url: sound.audio_url,
      description: sound.description,
      tags: sound.tags.map(tag => tag.name),
      bpm: sound.bpm,
      key: sound.key
    }));

    return NextResponse.json(transformedSounds);
  } catch (error) {
    console.error('Error fetching sounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sounds' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { soundId } = body;

    if (!soundId) {
      return NextResponse.json(
        { error: 'Missing soundId', details: 'soundId is required' },
        { status: 400 }
      );
    }

    const { data: sound, error: soundError } = await supabase
      .from('sounds')
      .select('*')
      .eq('id', soundId)
      .single();

    if (soundError) {
      return NextResponse.json(
        { error: 'Sound not found', details: soundError.message },
        { status: 404 }
      );
    }

    // Check if sound already exists in user's collection
    const { data: existingSound, error: existingError } = await supabase
      .from('sounds')
      .select('*')
      .eq('id', soundId)
      .eq('user_id', session.user.id)
      .single();

    if (existingSound) {
      return NextResponse.json(
        { error: 'Sound already exists', details: 'This sound is already in your collection' },
        { status: 400 }
      );
    }

    // Add sound to user's collection
    const { error: insertError } = await supabase
      .from('sounds')
      .insert([
        {
          ...sound,
          user_id: session.user.id
        }
      ]);

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to save sound', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving sound:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 