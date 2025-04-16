'use client';

import Layout from '@/components/layout/Layout';
import SearchBox from '@/components/SearchBox';

export default function Home() {
  return (
    <Layout>
      <div className="min-h-screen bg-[#000000] text-white">
        <div className="container mx-auto px-4 py-8">
          <SearchBox />
        </div>
      </div>
    </Layout>
  );
}
