import { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies[name]; // Use req.cookies directly for API routes
          },
          // set and remove might be needed depending on auth flow, but likely not for just getSession
        },
      }
    );

    try {
      // Get the user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Session error:', sessionError);
        return res.status(500).json({ error: 'Failed to retrieve session' });
      }

      if (!session) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userId = session.user.id; // Use the actual user ID from the session

      // Fetch search_count for the authenticated user
      const { data, error } = await supabase
        .from('users')
        .select('search_count')
        .eq('id', userId)
        .single();

      if (error) {
         if (error.code === 'PGRST116') { 
          // No user record found, return 0 searches
          console.warn(`User record not found for ID: ${userId} in search-count endpoint. Returning 0.`);
          return res.status(200).json({ search_count: 0 });
        } else {
          console.error('Error fetching search count:', error);
          return res.status(500).json({ error: 'Failed to fetch search count' });
        }
      }

      res.status(200).json({ search_count: data?.search_count ?? 0 }); // Return count or 0 if data is null
    } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Unexpected error occurred' });
    }
  } else {
    res.setHeader('Allow', 'GET');
    res.status(405).end('Method Not Allowed');
  }
} 