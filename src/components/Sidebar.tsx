'use client';

import Button from './Button';
import Image from 'next/image';

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#1C1C1E] p-4 shadow-xl">
      <div className="mb-6">
        <Image
          src="/logo.svg"
          alt="Cue Music"
          width={100}
          height={32}
          className="w-auto h-8"
          priority
        />
      </div>

      <nav>
        <ul className="space-y-2">
          <li>
            <Button href="/" className="w-full text-left px-4 py-2 rounded-lg text-purple-300 hover:text-purple-200 hover:bg-[#2C2C2E] transition-colors duration-200">
              Home
            </Button>
          </li>
          <li>
            <Button href="/library" className="w-full text-left px-4 py-2 rounded-lg text-purple-300 hover:text-purple-200 hover:bg-[#2C2C2E] transition-colors duration-200">
              Library
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
