import {
  collection,
  doc,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
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

// Helper function to hash password (in a real app, use a proper hashing library)
export const hashPassword = async (password: string): Promise<string> => {
  // This is a simple hash for demonstration purposes
  // In a production app, use a proper hashing library like bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Room operations
export const createRoom = async (name: string, password: string) => {
  try {
    // Hash the password for security
    const passwordHash = await hashPassword(password);

    // Create a new room document
    const roomRef = await addDoc(collection(db, 'rooms'), {
      name,
      passwordHash,
      createdAt: serverTimestamp(),
    });

    return roomRef.id;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const joinRoom = async (roomId: string, password: string) => {
  try {
    // Get the room document
    const roomDoc = await getDoc(doc(db, 'rooms', roomId));

    if (!roomDoc.exists()) {
      throw new Error('Room not found');
    }

    const roomData = roomDoc.data() as Room;

    // Verify the password
    const passwordHash = await hashPassword(password);
    if (passwordHash !== roomData.passwordHash) {
      throw new Error('Incorrect password');
    }

    return roomId;
  } catch (error) {
    console.error('Error joining room:', error);
    throw error;
  }
};

// Message operations
export const sendMessage = async (roomId: string, text: string, userName: string) => {
  try {
    await addDoc(collection(db, 'messages'), {
      text,
      roomId,
      userName: userName || 'Anonymous',
      createdAt: serverTimestamp(),
    });
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
