'use client';

import React, { useState, useRef, ChangeEvent } from 'react';
import { useUserContext } from '../../contexts/UserContext';
import { Avatar } from './Avatar';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface AvatarUploadProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onAvatarChange?: (url: string) => void;
}

/**
 * Component for uploading and managing user avatars
 */
export function AvatarUpload({ 
  className = '', 
  size = 'lg',
  onAvatarChange
}: AvatarUploadProps) {
  const { userProfile, uploadProfileAvatar, removeProfileAvatar } = useUserContext();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const avatarUrl = await uploadProfileAvatar(file);
      if (onAvatarChange) {
        onAvatarChange(avatarUrl);
      }
    } catch (err) {
      setError('Failed to upload avatar. Please try again.');
      console.error('Avatar upload error:', err);
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setError(null);

    try {
      await removeProfileAvatar();
      if (onAvatarChange) {
        onAvatarChange('');
      }
    } catch (err) {
      setError('Failed to remove avatar. Please try again.');
      console.error('Avatar removal error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <Avatar 
          src={userProfile?.avatarUrl} 
          alt={userProfile?.displayName || userProfile?.userName || 'User'} 
          size={size}
        />

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <LoadingSpinner size="small" />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 w-full">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        <Button 
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full"
          variant="outline"
          size="sm"
        >
          {userProfile?.avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
        </Button>

        {userProfile?.avatarUrl && (
          <Button 
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="w-full"
            variant="danger"
            size="sm"
          >
            Remove Avatar
          </Button>
        )}

        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
    </div>
  );
}
