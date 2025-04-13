'use client';

import { useState, useRef } from 'react';

interface BulkSoundUploaderProps {
  libraryId: string;
  onUploadComplete?: (sounds: any[]) => void;
}

interface UploadItem {
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function BulkSoundUploader({ libraryId, onUploadComplete }: BulkSoundUploaderProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newItems: UploadItem[] = files.map(file => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      status: 'pending'
    }));
    setUploadItems(newItems);
  };

  const uploadFile = async (item: UploadItem): Promise<void> => {
    const formData = new FormData();
    formData.append('file', item.file);
    formData.append('name', item.name);
    formData.append('libraryId', libraryId);
    
    // Extract BPM from filename if it matches pattern (e.g., "Loop 128 BPM")
    const bpmMatch = item.name.match(/\b(\d{2,3})\s*(?:bpm|BPM)\b/);
    if (bpmMatch) {
      formData.append('bpm', bpmMatch[1]);
    }

    // Extract key from filename if it matches pattern (e.g., "Melody (Am)" or "Bass - C min")
    const keyMatch = item.name.match(/[A-G][#b]?\s*(?:maj|min|major|minor|m)\b/i);
    if (keyMatch) {
      formData.append('key', keyMatch[0]);
    }

    // Extract tags from filename
    const tags = item.name
      .toLowerCase()
      .split(/[-_\s]/)
      .filter(tag => tag.length > 2 && !tag.match(/\d+/));
    formData.append('tags', tags.join(','));

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const handleUpload = async () => {
    setIsUploading(true);
    const results = [];

    for (let i = 0; i < uploadItems.length; i++) {
      const item = uploadItems[i];
      setUploadItems(prev => prev.map((prevItem, index) => 
        index === i ? { ...prevItem, status: 'uploading' } : prevItem
      ));

      try {
        const result = await uploadFile(item);
        results.push(result);
        setUploadItems(prev => prev.map((prevItem, index) => 
          index === i ? { ...prevItem, status: 'success' } : prevItem
        ));
      } catch (error) {
        setUploadItems(prev => prev.map((prevItem, index) => 
          index === i ? { ...prevItem, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } : prevItem
        ));
      }
    }

    setIsUploading(false);
    if (onUploadComplete) {
      onUploadComplete(results);
    }
  };

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'uploading': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Select Audio Files
        </button>
      </div>

      {uploadItems.length > 0 && (
        <div className="space-y-4">
          <div className="max-h-60 overflow-y-auto space-y-2">
            {uploadItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className={getStatusColor(item.status)}>●</span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => setUploadItems(prev => prev.map((prevItem, i) => 
                    i === index ? { ...prevItem, name: e.target.value } : prevItem
                  ))}
                  className="flex-1 px-2 py-1 border rounded"
                />
                {item.error && <span className="text-red-500 text-sm">{item.error}</span>}
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading || uploadItems.length === 0}
            className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Upload All Files'}
          </button>
        </div>
      )}
    </div>
  );
} 