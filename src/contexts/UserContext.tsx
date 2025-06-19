'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  authenticatedRooms: string[];
  addAuthenticatedRoom: (roomId: string) => void;
  isRoomAuthenticated: (roomId: string) => boolean;
  refreshUserSession: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Keys for storing data in localStorage
const AUTHENTICATED_ROOMS_KEY = 'pong_authenticated_rooms';
const USER_NAME_KEY = 'pong_user_name';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>('Anonymous');
  const [authenticatedRooms, setAuthenticatedRooms] = useState<string[]>([]);

  // Custom setUserName function that also saves to localStorage
  const handleSetUserName = (name: string) => {
    setUserName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_NAME_KEY, name);
    }
  };

  // Function to refresh user session data from the server
  const refreshUserSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        if (data.isLoggedIn && data.userName) {
          handleSetUserName(data.userName);
        }
      }
    } catch (error) {
      console.error('Error refreshing user session:', error);
    }
  };

  // Load authenticated rooms and userName from localStorage on initial render
  useEffect(() => {
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
    }
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
      authenticatedRooms, 
      addAuthenticatedRoom, 
      isRoomAuthenticated,
      refreshUserSession
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
