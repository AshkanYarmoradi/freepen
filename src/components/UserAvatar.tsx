'use client';

import React from 'react';
import { useUserContext } from '../contexts/UserContext';
import { Avatar } from './ui/Avatar';
import Link from 'next/link';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  linkToProfile?: boolean;
}

/**
 * Component for displaying the current user's avatar
 * Can optionally link to the user's profile page
 */
export function UserAvatar({ 
  size = 'md', 
  className = '',
  linkToProfile = true
}: UserAvatarProps) {
  const { userProfile, isProfileLoading } = useUserContext();
  
  const avatar = (
    <Avatar 
      src={userProfile?.avatarUrl} 
      alt={userProfile?.displayName || userProfile?.userName || 'User'} 
      size={size}
      className={className}
    />
  );
  
  // If loading or no profile, just return the avatar
  if (isProfileLoading || !userProfile || !linkToProfile) {
    return avatar;
  }
  
  // Otherwise, wrap in a link to the profile page
  return (
    <Link href="/profile" className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
      {avatar}
    </Link>
  );
}