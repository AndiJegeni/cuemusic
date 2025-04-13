'use client';

import dynamic from 'next/dynamic';

const SearchBox = dynamic(() => import('@/components/SearchBox'), { ssr: false });

export default function HomeClient() {
  return (
    <div className="text-center">
      <h1 className="mb-12 text-4xl font-medium text-[#4B5563]">
        Search for your perfect sound
      </h1>
      <div className="w-[600px]">
        <SearchBox />
      </div>
    </div>
  );
}
