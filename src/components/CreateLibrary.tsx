'use client';

import { useState } from 'react';

interface CreateLibraryProps {
  onLibraryCreated?: (library: { id: string; name: string }) => void;
}

export function CreateLibrary({ onLibraryCreated }: CreateLibraryProps) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      console.log('Sending request to create library:', name);
      const response = await fetch('/api/libraries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      console.log('Response status:', response.status);
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create library');
      }

      if (onLibraryCreated) {
        onLibraryCreated(data);
      }
      setName('');
    } catch (err) {
      console.error('Error creating library:', err);
      setError(err instanceof Error ? err.message : 'Failed to create library');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Create a Sound Library</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Library name"
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isCreating}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create Library'}
        </button>
      </form>
    </div>
  );
} 