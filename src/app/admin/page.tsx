'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { getAudioSource } from '@/utils/audio';

interface Sound {
  id: string;
  name: string;
  url: string;
  tags: string[];
  created_at: string;
}

export default function AdminPage() {
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSound, setEditingSound] = useState<Sound | null>(null);
  const [tags, setTags] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    console.log('Fetching sounds...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    fetchSounds();
  }, []);

  const fetchSounds = async () => {
    try {
      console.log('Starting fetch...');
      
      // First, let's check if the table exists
      const { data: tableData, error: tableError } = await supabase
        .from('sounds')
        .select('count')
        .limit(1);
      
      console.log('Table check:', { tableData, tableError });

      const { data, error } = await supabase
        .from('sounds')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Fetch response:', { 
        data, 
        error,
        errorDetails: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setSounds(data || []);
      console.log('Sounds set:', data);
    } catch (error) {
      console.error('Error in fetchSounds:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch sounds');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sound: Sound) => {
    setEditingSound(sound);
    setTags(Array.isArray(sound.tags) ? sound.tags.join(', ') : '');
  };

  const handleSave = async () => {
    if (!editingSound) return;

    try {
      // Convert the comma-separated string to an array and clean it up
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      console.log('Saving tags:', tagsArray);

      const { error } = await supabase
        .from('sounds')
        .update({
          tags: tagsArray
        })
        .eq('id', editingSound.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      // Update the local state immediately
      setSounds(prevSounds => 
        prevSounds.map(sound => 
          sound.id === editingSound.id 
            ? { ...sound, tags: tagsArray }
            : sound
        )
      );

      // Show success message
      setSuccess('Tags updated successfully!');
      
      // Close the edit modal after a short delay
      setTimeout(() => {
        setEditingSound(null);
        setSuccess(null);
      }, 2000);

    } catch (error) {
      console.error('Error updating sound:', error);
      setError(error instanceof Error ? error.message : 'Failed to update tags');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading sounds...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Manage Sounds</h1>
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {sounds.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">No sounds found.</p>
          <p className="text-sm text-gray-500 mt-2">
            Upload sounds in Supabase Storage and add them to the sounds table to get started.
          </p>
          <button
            onClick={fetchSounds}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Sounds
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sounds.map((sound) => (
            <div key={sound.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{sound.name}</h3>
                  <p className="text-sm text-gray-600">
                    Tags: {Array.isArray(sound.tags) ? sound.tags.join(', ') : 'No tags'}
                  </p>
                  <audio controls className="mt-2">
                    <source src={getAudioSource(sound.url)} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <button
                  onClick={() => handleEdit(sound)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit Tags
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSound && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Tags</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Tags
              </label>
              <div className="text-sm text-gray-500 mb-2">
                {Array.isArray(editingSound.tags) ? editingSound.tags.join(', ') : 'No tags'}
              </div>
            </div>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags, separated by commas"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setEditingSound(null);
                  setError(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 