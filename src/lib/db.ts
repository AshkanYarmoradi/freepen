import { onSnapshot, query, collection, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Room {
  id: string;
  name: string;
  createdAt: Timestamp;
  passwordHash: string; // Storing password hash for security
}

export interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  userName: string;
  roomId: string;
}

// Room operations
export const createRoom = async (name: string, password: string, userName?: string) => {
  try {
    const response = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        password,
        userName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create room');
    }

    const data = await response.json();
    return data.roomId;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const joinRoom = async (roomId: string, password: string, userName: string) => {
  try {
    const response = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        password,
        userName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to join room');
    }

    const data = await response.json();
    return data.roomId;
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Message operations
export const sendMessage = async (roomId: string, text: string, userName: string) => {
  try {
    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomId,
        text,
        userName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const useRoomMessages = (roomId: string, callback: (messages: Message[]) => void) => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];

    callback(messages);
  });
};
