import { onSnapshot, query, collection, where, orderBy, Timestamp, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Room entity interface
 */
export interface Room {
  id: string;
  name: string;
  createdAt: Timestamp;
  passwordHash: string; // Storing password hash for security
}

/**
 * Message entity interface
 */
export interface Message {
  id: string;
  text: string;
  createdAt: Timestamp;
  userName: string;
  roomId: string;
}

/**
 * Create a new room
 * @param name The name of the room
 * @param password The password for the room
 * @param userName Optional username for unauthenticated users
 * @returns Promise resolving to the created room ID
 * @throws Error if room creation fails
 */
export const createRoom = async (name: string, password: string, userName?: string): Promise<string> => {
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

/**
 * Join an existing room
 * @param roomId The ID of the room to join
 * @param password The password for the room
 * @param userName The username of the user joining the room
 * @returns Promise resolving to the joined room ID
 * @throws Error if joining the room fails
 */
export const joinRoom = async (roomId: string, password: string, userName: string): Promise<string> => {
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

/**
 * Message operations
 */

/**
 * Send a message to a room
 * @param roomId The ID of the room to send the message to
 * @param text The text content of the message
 * @param userName The username of the message sender
 * @returns Promise that resolves when the message is sent successfully
 * @throws Error if sending the message fails
 */
export const sendMessage = async (roomId: string, text: string, userName: string): Promise<void> => {
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

/**
 * Subscribe to messages in a room
 * @param roomId The ID of the room to subscribe to
 * @param callback Function to call when messages are updated
 * @returns Unsubscribe function to stop listening for updates
 */
export const subscribeToRoomMessages = (
  roomId: string, 
  callback: (messages: Message[]) => void
): Unsubscribe => {
  // Create a query for messages in this room, ordered by creation time
  const messagesQuery = query(
    collection(db, 'messages'),
    where('roomId', '==', roomId),
    orderBy('createdAt', 'asc')
  );

  // Subscribe to the query and transform the results
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];

    // Call the callback with the updated messages
    callback(messages);
  });
};
