'use client';

import React from 'react';
import { UserProfile } from '../../components/UserProfile';
import { useUserContext } from '../../contexts/UserContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

/**
 * User profile page
 */
export default function ProfilePage() {
  const { isProfileLoading } = useUserContext();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

      {isProfileLoading ? (
        <div className="flex justify-center items-center p-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <UserProfile />
        </div>
      )}
    </div>
  );
}
