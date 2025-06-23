'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Avatar component for displaying user profile images
 */
export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  fallback
}: AvatarProps) {
  const [error, setError] = useState(false);
  
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  
  // Generate initials from alt text for fallback
  const getInitials = () => {
    if (!alt) return '';
    return alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Default fallback is a circle with initials
  const defaultFallback = (
    <div className={`flex items-center justify-center bg-gray-200 text-gray-600 rounded-full ${sizeClasses[size]}`}>
      <span className={`font-medium ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}`}>
        {getInitials()}
      </span>
    </div>
  );
  
  // If there's an error loading the image or no src, show fallback
  if (error || !src) {
    return (
      <div className={className}>
        {fallback || defaultFallback}
      </div>
    );
  }
  
  return (
    <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`(max-width: 768px) ${size === 'sm' ? '2rem' : size === 'md' ? '3rem' : size === 'lg' ? '4rem' : '6rem'}, ${size === 'sm' ? '2rem' : size === 'md' ? '3rem' : size === 'lg' ? '4rem' : '6rem'}`}
        className="object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}