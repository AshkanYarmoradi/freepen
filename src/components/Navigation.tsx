'use client';

import React from 'react';
import Link from 'next/link';
import { useUserContext } from '../contexts/UserContext';
import { UserAvatar } from './UserAvatar';

/**
 * Navigation component for the application
 */
export function Navigation() {
  const { userName } = useUserContext();
  
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-indigo-600">
          freepen
        </Link>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/create-room" className="text-gray-600 hover:text-indigo-600">
              Create Room
            </Link>
            <Link href="/join-room" className="text-gray-600 hover:text-indigo-600">
              Join Room
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:block text-sm text-gray-600">
              {userName}
            </div>
            <UserAvatar size="sm" linkToProfile={true} />
          </div>
        </div>
      </div>
    </nav>
  );
}