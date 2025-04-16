import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
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

    // Verify the sound belongs to the user
    const sound = await prisma.sound.findFirst({
      where: {
        id: context.params.id,
        library: {
          userId: user.id
        }
      }
    });

    if (!sound) {
      return NextResponse.json(
        { error: 'Sound not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete the sound
    await prisma.sound.delete({
      where: {
        id: context.params.id
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting sound:', error);
    return NextResponse.json(
      { error: 'Failed to delete sound' },
      { status: 500 }
    );
  }
} 