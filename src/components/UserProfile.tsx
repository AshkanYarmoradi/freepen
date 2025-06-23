'use client';

import React, { useState } from 'react';
import { useUserContext } from '../contexts/UserContext';
import { Avatar } from './ui/Avatar';
import { AvatarUpload } from './ui/AvatarUpload';
import LoadingSpinner from './ui/LoadingSpinner';
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface UserProfileProps {
  className?: string;
  editable?: boolean;
}

/**
 * Component for displaying and editing user profiles
 */
export function UserProfile({ 
  className = '',
  editable = true
}: UserProfileProps) {
  const { userProfile, isProfileLoading, updateProfile } = useUserContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');

  // Start editing
  const handleEdit = () => {
    setDisplayName(userProfile?.displayName || '');
    setBio(userProfile?.bio || '');
    setIsEditing(true);
    setError(null);
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  // Save profile changes
  const handleSave = async () => {
    if (!userProfile) return;

    setIsSaving(true);
    setError(null);

    try {
      await updateProfile({
        displayName,
        bio
      });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Profile update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isProfileLoading) {
    return (
      <div className={`flex justify-center items-center p-8 ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // No profile state
  if (!userProfile) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p className="text-gray-500">User profile not available</p>
      </div>
    );
  }

  // View mode
  if (!isEditing) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <Avatar 
            src={userProfile.avatarUrl} 
            alt={userProfile.displayName || userProfile.userName} 
            size="xl"
          />

          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {userProfile.displayName || userProfile.userName}
            </h2>
            <p className="text-gray-500 mb-2">@{userProfile.userName}</p>

            {userProfile.bio && (
              <p className="text-gray-700 mt-2">{userProfile.bio}</p>
            )}

            {editable && (
              <Button 
                onClick={handleEdit} 
                className="mt-4"
                variant="outline"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className={`p-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <AvatarUpload />

        <div className="flex-1 w-full">
          <div className="mb-4">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              disabled={isSaving}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <Input
              id="username"
              value={userProfile.userName}
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>

          <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              disabled={isSaving}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? <LoadingSpinner size="small" /> : 'Save Profile'}
            </Button>

            <Button 
              onClick={handleCancel} 
              disabled={isSaving}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
