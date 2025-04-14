export function getAudioSource(url: string): string {
  // Check if the URL is a full URL (starts with http:// or https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a file path, prepend the base URL with the correct bucket name 'audio'
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/audio/${url}`;
} 