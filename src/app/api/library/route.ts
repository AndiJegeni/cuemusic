import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

    // Check if user already has a library
    const { data: existingLibrary } = await supabase
      .from('sound_libraries')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (existingLibrary) {
      return NextResponse.json(existingLibrary);
    }

    // Create a new library for the user
    const { data: newLibrary, error: createError } = await supabase
      .from('sound_libraries')
      .insert([{ user_id: session.user.id }])
      .select()
      .single();

    if (createError) {
      console.error('Create library error:', createError);
      return NextResponse.json({ error: 'Failed to create library' }, { status: 500 });
    }

    return NextResponse.json(newLibrary);
  } catch (error) {
    console.error('Error managing library:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 