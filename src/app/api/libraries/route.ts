import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    // Parse request body
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Library name is required' }, { status: 400 });
    }

    // Create library
    const library = await prisma.soundLibrary.create({
      data: {
        name,
        userId: user.id,
      },
    });

    return NextResponse.json(library);
  } catch (error) {
    console.error('Error in POST /api/libraries:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    // Get libraries
    const libraries = await prisma.soundLibrary.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(libraries);
  } catch (error) {
    console.error('Error in GET /api/libraries:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 