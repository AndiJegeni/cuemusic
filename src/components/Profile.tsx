"use client";

import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  searchCount: number;
  maxSearches: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ searchCount, maxSearches }) => {
  const progress = (searchCount / maxSearches) * 100;

  return (
    <div className="w-full bg-gray-200 rounded-full h-4">
      <div
        className="bg-purple-600 h-4 rounded-full"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

const Profile: React.FC = () => {
  const [searchCount, setSearchCount] = useState(0);
  const maxSearches = 15;

  useEffect(() => {
    // Fetch the user's search count from the backend
    const fetchSearchCount = async () => {
      try {
        const response = await fetch('/api/user/search-count');
        const data = await response.json();
        setSearchCount(data.search_count);
      } catch (error) {
        console.error('Failed to fetch search count:', error);
      }
    };

    fetchSearchCount();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Your Search Progress</h2>
      <ProgressBar searchCount={searchCount} maxSearches={maxSearches} />
      <p className="mt-2">{searchCount} out of {maxSearches} searches used</p>
    </div>
  );
};

export default Profile; 