import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface Sound {
  id: string;
  name: string;
  audio_url: string;
  description?: string;
  tags: string[];
  bpm?: number;
  key?: string;
  library_id: string;
  created_at: string;
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

    // First get or create the user's library
    let { data: library, error: libraryError } = await supabase
      .from('sound_libraries')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (libraryError && libraryError.code === 'PGRST116') {
      // Library doesn't exist, create it
      const { data: newLibrary, error: createError } = await supabase
        .from('sound_libraries')
        .insert([{ user_id: session.user.id }])
        .select()
        .single();

      if (createError) {
        console.error('Create library error:', createError);
        return NextResponse.json({ error: 'Failed to create library' }, { status: 500 });
      }

      library = newLibrary;
    } else if (libraryError) {
      console.error('Library error:', libraryError);
      return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
    }

    if (!library) {
      return NextResponse.json({ error: 'No library found' }, { status: 404 });
    }

    // Then get sounds from that library
    const { data: sounds, error } = await supabase
      .from('sounds')
      .select('*')
      .eq('library_id', library.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data to match the client-side interface
    const transformedSounds = (sounds || []).map((sound: Sound) => ({
      id: sound.id,
      name: sound.name,
      url: sound.audio_url,
      description: sound.description,
      tags: Array.isArray(sound.tags) ? sound.tags : [],
      bpm: sound.bpm,
      key: sound.key,
      createdAt: sound.created_at
    }));

    return NextResponse.json(transformedSounds);
  } catch (error) {
    console.error('Error fetching sounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sounds', details: error instanceof Error ? error.message : 'Unknown error' },
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

    // First get or create the user's library
    let { data: library, error: libraryError } = await supabase
      .from('sound_libraries')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (libraryError && libraryError.code === 'PGRST116') {
      // Library doesn't exist, create it
      const { data: newLibrary, error: createError } = await supabase
        .from('sound_libraries')
        .insert([{ user_id: session.user.id }])
        .select()
        .single();

      if (createError) {
        console.error('Create library error:', createError);
        return NextResponse.json({ error: 'Failed to create library' }, { status: 500 });
      }

      library = newLibrary;
    } else if (libraryError) {
      console.error('Library error:', libraryError);
      return NextResponse.json({ error: 'Failed to fetch library' }, { status: 500 });
    }

    if (!library) {
      return NextResponse.json({ error: 'No library found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, url, tags, bpm, key } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'name and url are required' },
        { status: 400 }
      );
    }

    // Add sound to user's library
    const { data: newSound, error: insertError } = await supabase
      .from('sounds')
      .insert([
        {
          name,
          audio_url: url,
          tags: Array.isArray(tags) ? tags : [],
          bpm,
          key,
          library_id: library.id
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save sound', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(newSound);
  } catch (error) {
    console.error('Error saving sound:', error);
    return NextResponse.json(
      { error: 'Failed to save sound', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 