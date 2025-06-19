'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  userName: string;
  setUserName: (name: string) => void;
  authenticatedRooms: string[];
  addAuthenticatedRoom: (roomId: string) => void;
  isRoomAuthenticated: (roomId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Key for storing authenticated rooms in localStorage
const AUTHENTICATED_ROOMS_KEY = 'pong_authenticated_rooms';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState<string>('Anonymous');
  const [authenticatedRooms, setAuthenticatedRooms] = useState<string[]>([]);

  // Load authenticated rooms from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRooms = localStorage.getItem(AUTHENTICATED_ROOMS_KEY);
      if (storedRooms) {
        try {
          setAuthenticatedRooms(JSON.parse(storedRooms));
        } catch (error) {
          console.error('Error parsing authenticated rooms from localStorage:', error);
        }
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
      setUserName, 
      authenticatedRooms, 
      addAuthenticatedRoom, 
      isRoomAuthenticated 
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
