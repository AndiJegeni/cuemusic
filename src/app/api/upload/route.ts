import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { RequestCookies } from 'next/dist/server/web/spec-extension/cookies';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies() as unknown as RequestCookies;
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
        },
      }
    );

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const libraryId = formData.get('libraryId') as string;

    if (!file || !libraryId) {
      return NextResponse.json({ error: 'File and library ID are required' }, { status: 400 });
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('sounds')
      .upload(`${libraryId}/${file.name}`, file);

    if (uploadError) {
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 });
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('sounds')
      .getPublicUrl(`${libraryId}/${file.name}`);

    // Create sound record in database
    const { data: sound, error: soundError } = await supabase
      .from('sounds')
      .insert([
        {
          name: file.name,
          audio_url: publicUrl,
          library_id: libraryId,
        }
      ])
      .select()
      .single();

    if (soundError) {
      return NextResponse.json({ error: soundError.message }, { status: 500 });
    }

    return NextResponse.json(sound);
  } catch (error) {
    console.error('Error in POST /api/upload:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 