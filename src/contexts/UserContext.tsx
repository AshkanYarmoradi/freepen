'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import multiavatar from '@multiavatar/multiavatar/esm';

interface UserContextType {
  userName: string;
  setUserName: (_name: string) => void;
  authenticatedRooms: string[];
  addAuthenticatedRoom: (_roomId: string) => void;
  isRoomAuthenticated: (_roomId: string) => boolean;
  refreshUserSession: () => Promise<string>;
  getUserAvatar: (_roomId: string) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Keys for storing data in localStorage
const AUTHENTICATED_ROOMS_KEY = 'freepen_authenticated_rooms';
const USER_NAME_KEY = 'freepen_user_name';
const USER_AVATARS_KEY = 'freepen_user_avatars';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>('Anonymous');
  const [authenticatedRooms, setAuthenticatedRooms] = useState<string[]>([]);
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

  // Custom setUserName function that also saves to localStorage
  const handleSetUserName = useCallback((name: string) => {
    setUserName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_NAME_KEY, name);
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

  // Load authenticated rooms, userName, and avatars from localStorage and server on initial render
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
        }

        // Load user avatars
        const storedAvatars = localStorage.getItem(USER_AVATARS_KEY);
        if (storedAvatars) {
          try {
            setUserAvatars(JSON.parse(storedAvatars));
          } catch (error) {
            console.error('Error parsing user avatars from localStorage:', error);
          }
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

  // Get or generate avatar for user in a specific room
  const getUserAvatar = useCallback((roomId: string): string => {
    const avatarKey = `${userName}-${roomId}`;

    // If we already have an avatar for this user in this room, return it
    if (userAvatars[avatarKey]) {
      return userAvatars[avatarKey];
    }

    // Otherwise, generate a new avatar with a consistent seed
    // We use the avatarKey itself as the seed to ensure consistency
    const svgCode = multiavatar(avatarKey);

    // Store the new avatar
    const updatedAvatars = {
      ...userAvatars,
      [avatarKey]: svgCode
    };

    setUserAvatars(updatedAvatars);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_AVATARS_KEY, JSON.stringify(updatedAvatars));
    }

    return svgCode;
  }, [userName, userAvatars]);

  return (
    <UserContext.Provider value={{ 
      userName, 
      setUserName: handleSetUserName, 
      authenticatedRooms, 
      addAuthenticatedRoom, 
      isRoomAuthenticated,
      refreshUserSession,
      getUserAvatar
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
