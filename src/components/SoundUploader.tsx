import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface SoundUploaderProps {
  libraryId: string;
  onUploadComplete?: (sound: any) => void;
}

export function SoundUploader({ libraryId, onUploadComplete }: SoundUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append('libraryId', libraryId);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const sound = await response.json();
      if (onUploadComplete) {
        onUploadComplete(sound);
      }

      // Reset form
      event.currentTarget.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload sound');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4">
      <div>
        <Label htmlFor="file">Audio File</Label>
        <Input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          accept="audio/*"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Sound name"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Sound description"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bpm">BPM (optional)</Label>
          <Input
            id="bpm"
            name="bpm"
            type="number"
            min="1"
            max="999"
            placeholder="120"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="key">Key (optional)</Label>
          <Input
            id="key"
            name="key"
            type="text"
            placeholder="C minor"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          name="tags"
          type="text"
          placeholder="drums, loop, bass"
          className="mt-1"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}

      <Button
        type="submit"
        disabled={isUploading}
        className="w-full"
      >
        {isUploading ? 'Uploading...' : 'Upload Sound'}
      </Button>
    </form>
  );
} 