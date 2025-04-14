import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all sounds for the user
    const sounds = await prisma.sound.findMany({
      where: {
        library: {
          userId: user.id
        }
      },
      include: {
        tags: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the client-side interface
    const transformedSounds = sounds.map(sound => ({
      id: sound.id,
      name: sound.name,
      url: sound.audioUrl,
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
    console.log('Received sound save request');
    
    // Get cookies
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

    // Check authentication
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !supabaseUser) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Failed to parse JSON' },
        { status: 400 }
      );
    }

    const { soundId } = body;
    if (!soundId) {
      console.error('Missing soundId in request');
      return NextResponse.json(
        { error: 'Missing soundId', details: 'soundId is required' },
        { status: 400 }
      );
    }

    // Get or create user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: supabaseUser.id },
      });

      if (!user) {
        console.log('Creating new user:', supabaseUser.id);
        user = await prisma.user.create({
          data: {
            id: supabaseUser.id,
            email: supabaseUser.email,
            name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
          },
        });
      }
    } catch (error) {
      console.error('Failed to get/create user:', error);
      return NextResponse.json(
        { error: 'Failed to create user', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Get or create user's library
    let library;
    try {
      library = await prisma.soundLibrary.findFirst({
        where: { userId: user.id },
      });

      if (!library) {
        console.log('Creating new library for user:', user.id);
        library = await prisma.soundLibrary.create({
          data: {
            userId: user.id,
            name: 'My Collection',
          },
        });
      }
    } catch (error) {
      console.error('Failed to get/create library:', error);
      return NextResponse.json(
        { error: 'Failed to create collection', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Get sound data from Supabase
    const { data: soundData, error: soundError } = await supabase
      .from('sounds')
      .select('*')
      .eq('id', soundId)
      .single();

    if (soundError || !soundData) {
      console.error('Failed to fetch sound data:', soundError);
      return NextResponse.json(
        { error: 'Sound not found', details: soundError?.message },
        { status: 404 }
      );
    }

    // Check if sound already exists in library
    const existingSound = await prisma.sound.findFirst({
      where: {
        OR: [
          {
            name: soundData.name || soundId,
            libraryId: library.id,
          },
          {
            audioUrl: soundData.audioUrl || soundData.url,
            libraryId: library.id,
          }
        ]
      },
    });

    if (existingSound) {
      console.log('Sound already exists in library:', {
        name: soundData.name || soundId,
        audioUrl: soundData.audioUrl || soundData.url
      });
      return NextResponse.json(
        { error: 'Sound already exists', details: 'This sound is already in your collection' },
        { status: 400 }
      );
    }

    // Save sound to library
    try {
      console.log('Creating sound with data:', {
        name: soundData.name || soundId,
        description: soundData.description || '',
        audioUrl: soundData.audioUrl || soundData.url,
        libraryId: library.id,
        tags: soundData.tags || [],
      });

      // Ensure tags is an array
      const tags = Array.isArray(soundData.tags) ? soundData.tags : [];
      
      const savedSound = await prisma.sound.create({
        data: {
          name: soundData.name || soundId,
          description: soundData.description || '',
          audioUrl: soundData.audioUrl || soundData.url,
          libraryId: library.id,
          tags: {
            connectOrCreate: tags.map((tag: string) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          },
        },
        include: {
          tags: true,
        },
      });

      console.log('Successfully saved sound:', savedSound.id);
      return NextResponse.json(
        { success: true, sound: savedSound },
        { status: 200 }
      );
    } catch (error) {
      console.error('Failed to save sound:', error);
      return NextResponse.json(
        { 
          error: 'Failed to save sound', 
          details: error instanceof Error ? error.message : 'Unknown error',
          debug: {
            soundData,
            error: error instanceof Error ? error.stack : 'No stack trace'
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 