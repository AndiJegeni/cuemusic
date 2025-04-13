'use client';

import Button from './Button';

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4">
      <h1 className="text-sm font-bold mb-6">Cue Music</h1>

      <nav>
        <ul className="space-y-1">
          <li>
            <Button href="/">
              Home
            </Button>
          </li>
          <li>
            <Button href="/library">
              Library
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
