'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile, getUserProfileByUserName, createUserProfile, updateUserProfile, uploadAvatar, deleteAvatar } from '../lib/user-profile';

interface UserContextType {
  userName: string;
  setUserName: (_name: string) => void;
  userProfile: UserProfile | null;
  isProfileLoading: boolean;
  authenticatedRooms: string[];
  addAuthenticatedRoom: (_roomId: string) => void;
  isRoomAuthenticated: (_roomId: string) => boolean;
  refreshUserSession: () => Promise<string>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<UserProfile>;
  uploadProfileAvatar: (file: File) => Promise<string>;
  removeProfileAvatar: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Keys for storing data in localStorage
const AUTHENTICATED_ROOMS_KEY = 'freepen_authenticated_rooms';
const USER_NAME_KEY = 'freepen_user_name';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>('Anonymous');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [authenticatedRooms, setAuthenticatedRooms] = useState<string[]>([]);

  // Custom setUserName function that also saves to localStorage and updates profile
  const handleSetUserName = useCallback(async (name: string) => {
    setUserName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_NAME_KEY, name);
    }

    // Update or create user profile when username changes
    await loadUserProfile(name);
  }, []);

  // Load user profile from Firestore
  const loadUserProfile = useCallback(async (name: string) => {
    setIsProfileLoading(true);
    try {
      // Try to get existing profile
      const profile = await getUserProfileByUserName(name);

      if (profile) {
        setUserProfile(profile);
      } else {
        // Create new profile if it doesn't exist
        const newProfile = await createUserProfile(name);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // Function to refresh user session data from the server
  const refreshUserSession = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.isLoggedIn && data.userName) {
          handleSetUserName(data.userName);
          return data.userName;
        }
      }
      return userName; // Return current userName if no update
    } catch (error) {
      console.error('Error refreshing user session:', error);
      return userName; // Return current userName on error
    }
  }, [userName, handleSetUserName]);

  // Update user profile
  const updateProfile = useCallback(async (
    updates: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserProfile> => {
    if (!userProfile) {
      throw new Error('No user profile loaded');
    }

    try {
      const updatedProfile = await updateUserProfile(userProfile.id, updates);
      setUserProfile(updatedProfile);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }, [userProfile]);

  // Upload profile avatar
  const uploadProfileAvatar = useCallback(async (file: File): Promise<string> => {
    if (!userProfile) {
      throw new Error('No user profile loaded');
    }

    try {
      const avatarUrl = await uploadAvatar(userProfile.id, file);
      setUserProfile(prev => prev ? { ...prev, avatarUrl } : null);
      return avatarUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }, [userProfile]);

  // Remove profile avatar
  const removeProfileAvatar = useCallback(async (): Promise<void> => {
    if (!userProfile || !userProfile.avatarUrl) {
      return;
    }

    try {
      await deleteAvatar(userProfile.id, userProfile.avatarUrl);
      setUserProfile(prev => prev ? { ...prev, avatarUrl: '' } : null);
    } catch (error) {
      console.error('Error removing avatar:', error);
      throw error;
    }
  }, [userProfile]);

  // Load authenticated rooms and userName from localStorage and server on initial render
  useEffect(() => {
    const initializeSession = async () => {
      if (typeof window !== 'undefined') {
        // Load authenticated rooms
        const storedRooms = localStorage.getItem(AUTHENTICATED_ROOMS_KEY);
        if (storedRooms) {
          try {
            setAuthenticatedRooms(JSON.parse(storedRooms));
          } catch (error) {
            console.error('Error parsing authenticated rooms from localStorage:', error);
          }
        }

        // Load userName
        const storedUserName = localStorage.getItem(USER_NAME_KEY);
        if (storedUserName) {
          setUserName(storedUserName);
          await loadUserProfile(storedUserName);
        } else {
          setIsProfileLoading(false);
        }

        // Fetch session from server to ensure client state is in sync
        try {
          const updatedUserName = await refreshUserSession();
          if (updatedUserName && updatedUserName !== userName) {
            handleSetUserName(updatedUserName);
          }
        } catch (error) {
          console.error('Error initializing session from server:', error);
        }
      }
    };

    initializeSession();

    // We only want to run this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add a room to the authenticated rooms list
  const addAuthenticatedRoom = (roomId: string) => {
    if (!authenticatedRooms.includes(roomId)) {
      const updatedRooms = [...authenticatedRooms, roomId];
      setAuthenticatedRooms(updatedRooms);

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTHENTICATED_ROOMS_KEY, JSON.stringify(updatedRooms));
      }
    }
  };

  // Check if a room is authenticated
  const isRoomAuthenticated = (roomId: string): boolean => {
    return authenticatedRooms.includes(roomId);
  };

  return (
    <UserContext.Provider value={{ 
      userName, 
      setUserName: handleSetUserName,
      userProfile,
      isProfileLoading,
      authenticatedRooms, 
      addAuthenticatedRoom, 
      isRoomAuthenticated,
      refreshUserSession,
      updateProfile,
      uploadProfileAvatar,
      removeProfileAvatar
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
