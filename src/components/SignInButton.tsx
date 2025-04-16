"use client";

import { createBrowserClient } from '@supabase/ssr';

export default function SignInButton() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignIn = async () => {
    // Get the site URL from environment variable or fallback to window.location.origin
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Error signing in:', error.message);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-2 text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0"
    >
      <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
        <path
          d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
          fill="#EA4335"
        />
        <path
          d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
          fill="#4285F4"
        />
        <path
          d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.27498 6.60986C0.46498 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46498 15.7699 1.27498 17.3899L5.26498 14.2949Z"
          fill="#FBBC05"
        />
        <path
          d="M12.0004 24C15.2354 24 17.9504 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.87043 19.245 6.21543 17.135 5.27045 14.29L1.28046 17.385C3.25546 21.31 7.31043 24 12.0004 24Z"
          fill="#34A853"
        />
      </svg>
      <span className="text-sm font-semibold leading-6">Sign in with Google</span>
    </button>
  );
} 