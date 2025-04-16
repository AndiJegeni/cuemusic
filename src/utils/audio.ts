export function getAudioSource(url: string | undefined | null): string {
  // Handle null, undefined, or empty string
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.warn('Invalid URL provided to getAudioSource:', url);
    return '';
  }

  try {
    // Check if the URL is a full URL (starts with http:// or https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's a file path, prepend the base URL with the correct bucket name 'audio'
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!baseUrl) {
      console.error('NEXT_PUBLIC_SUPABASE_URL is not defined');
      return '';
    }
    
    return `${baseUrl}/storage/v1/object/public/audio/${url}`;
  } catch (error) {
    console.error('Error processing audio URL:', error);
    return '';
  }
} 