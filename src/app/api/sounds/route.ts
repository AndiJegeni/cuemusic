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

    if (libraryError) {
      console.error('Library error:', libraryError);
      if (libraryError.code === 'PGRST116') {
        // Library doesn't exist, create it
        const { data: newLibrary, error: createError } = await supabase
          .from('sound_libraries')
          .insert([{ 
            user_id: session.user.id,
            name: 'My Library'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Create library error:', createError);
          return NextResponse.json({ 
            error: 'Failed to create library', 
            details: createError.message,
            code: createError.code 
          }, { status: 500 });
        }

        if (!newLibrary) {
          console.error('No library returned after creation');
          return NextResponse.json({ 
            error: 'Failed to create library', 
            details: 'No library data returned after creation'
          }, { status: 500 });
        }

        library = newLibrary;
      } else {
        return NextResponse.json({ 
          error: 'Failed to fetch library', 
          details: libraryError.message,
          code: libraryError.code 
        }, { status: 500 });
      }
    }

    if (!library) {
      console.error('No library found after all attempts');
      return NextResponse.json({ 
        error: 'No library found', 
        details: 'Library not found after creation attempt'
      }, { status: 404 });
    }

    // Get all sounds from the user's library
    const { data: sounds, error: soundsError } = await supabase
      .from('user_sounds')
      .select(`
        *,
        sounds: sound_id (
          id,
          name,
          audio_url,
          description,
          tags,
          bpm,
          key,
          created_at
        )
      `)
      .eq('library_id', library.id);

    if (soundsError) {
      console.error('Sounds error:', soundsError);
      return NextResponse.json({ 
        error: 'Failed to fetch sounds', 
        details: soundsError.message,
        code: soundsError.code 
      }, { status: 500 });
    }

    // Transform the data to match the client-side interface
    const transformedSounds = (sounds || []).map((userSound: any) => ({
      id: userSound.sounds.id,
      name: userSound.sounds.name,
      url: userSound.sounds.audio_url,
      description: userSound.sounds.description,
      tags: Array.isArray(userSound.sounds.tags) ? userSound.sounds.tags : [],
      bpm: userSound.sounds.bpm,
      key: userSound.sounds.key,
      createdAt: userSound.sounds.created_at
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

    if (libraryError) {
      console.error('Library error:', libraryError);
      if (libraryError.code === 'PGRST116') {
        // Library doesn't exist, create it
        const { data: newLibrary, error: createError } = await supabase
          .from('sound_libraries')
          .insert([{ 
            user_id: session.user.id,
            name: 'My Library'
          }])
          .select()
          .single();

        if (createError) {
          console.error('Create library error:', createError);
          return NextResponse.json({ 
            error: 'Failed to create library', 
            details: createError.message,
            code: createError.code 
          }, { status: 500 });
        }

        if (!newLibrary) {
          console.error('No library returned after creation');
          return NextResponse.json({ 
            error: 'Failed to create library', 
            details: 'No library data returned after creation'
          }, { status: 500 });
        }

        library = newLibrary;
      } else {
        return NextResponse.json({ 
          error: 'Failed to fetch library', 
          details: libraryError.message,
          code: libraryError.code 
        }, { status: 500 });
      }
    }

    if (!library) {
      console.error('No library found after all attempts');
      return NextResponse.json({ 
        error: 'No library found', 
        details: 'Library not found after creation attempt'
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, url, tags, bpm, key } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Missing required fields', details: 'name and url are required' },
        { status: 400 }
      );
    }

    // First check if the sound exists in the main sounds table
    const { data: existingSound, error: soundError } = await supabase
      .from('sounds')
      .select('*')
      .eq('audio_url', url)
      .single();

    let soundId;
    if (soundError && soundError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Sound lookup error:', soundError);
      return NextResponse.json(
        { error: 'Failed to check sound existence', details: soundError.message },
        { status: 500 }
      );
    }

    if (!existingSound) {
      // Sound doesn't exist, create it in the main sounds table
      const { data: newSound, error: createError } = await supabase
        .from('sounds')
        .insert([{
          name,
          audio_url: url,
          description: body.description,
          tags: Array.isArray(tags) ? tags : [],
          bpm,
          key
        }])
        .select()
        .single();

      if (createError) {
        console.error('Create sound error:', createError);
        return NextResponse.json(
          { error: 'Failed to create sound', details: createError.message },
          { status: 500 }
        );
      }
      soundId = newSound.id;
    } else {
      soundId = existingSound.id;
    }

    // Now create the reference in user_sounds
    const { data: userSound, error: userSoundError } = await supabase
      .from('user_sounds')
      .insert([{
        sound_id: soundId,
        library_id: library.id
      }])
      .select()
      .single();

    if (userSoundError) {
      console.error('User sound error:', userSoundError);
      return NextResponse.json(
        { error: 'Failed to save sound to library', details: userSoundError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(userSound);
  } catch (error) {
    console.error('Error saving sound:', error);
    return NextResponse.json(
      { error: 'Failed to save sound', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 