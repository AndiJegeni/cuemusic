import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

interface Sound {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags?: string[] | null;
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

    // First get the sound IDs from user_sounds
    const { data: userSounds, error: userSoundsError } = await supabase
      .from('user_sounds')
      .select('sound_id')
      .eq('library_id', library.id);

    if (userSoundsError) {
      console.error('User sounds error:', userSoundsError);
      return NextResponse.json({ 
        error: 'Failed to fetch user sounds', 
        details: userSoundsError.message,
        code: userSoundsError.code 
      }, { status: 500 });
    }

    if (!userSounds || userSounds.length === 0) {
      return NextResponse.json([]);
    }

    // Get the sounds using the sound IDs
    const soundIds = userSounds.map(us => us.sound_id);
    const { data: sounds, error: soundsError } = await supabase
      .from('sounds')
      .select('*')
      .in('id', soundIds);

    if (soundsError) {
      console.error('Sounds error:', soundsError);
      return NextResponse.json({ 
        error: 'Failed to fetch sounds', 
        details: soundsError.message,
        code: soundsError.code 
      }, { status: 500 });
    }

    // Transform the data to match the client-side interface
    const transformedSounds = (sounds || []).map((sound: Sound) => ({
      id: sound.id,
      name: sound.name,
      url: sound.url,
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

    // First check if the sound exists in the master catalog
    const { data: existingSound, error: findError } = await supabase
      .from('sounds')
      .select('*')
      .eq('url', url)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Find error:', findError);
      return NextResponse.json(
        { error: 'Failed to check sound existence', details: findError.message },
        { status: 500 }
      );
    }

    let soundId: string;
    if (!existingSound) {
      // Sound doesn't exist in master catalog, create it
      const { data: newSound, error: createError } = await supabase
        .from('sounds')
        .insert([{
          name,
          url: url,
          description: body.description,
          tags: Array.isArray(tags) ? tags : [],
          bpm,
          key
        }])
        .select()
        .single();

      if (createError) {
        console.error('Create error:', createError);
        return NextResponse.json(
          { error: 'Failed to create sound', details: createError.message },
          { status: 500 }
        );
      }

      soundId = newSound.id;
    } else {
      soundId = existingSound.id;
    }

    // Now add the sound to the user's library
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