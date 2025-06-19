import { Timestamp, Unsubscribe } from 'firebase/firestore';

/**
 * Message from server interface (for SSE)
 */
interface MessageFromServer {
  id: string;
  text: string;
  createdAt?: string; // ISO date string from server
  userName: string;
  roomId: string;
}

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
  createdAt: Date | null; // Changed from Timestamp to Date for compatibility with SSE
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
 * @param userName Optional username of the message sender (if not provided, uses session username)
 * @returns Promise that resolves when the message is sent successfully
 * @throws Error if sending the message fails
 */
export const sendMessage = async (roomId: string, text: string, userName?: string): Promise<void> => {
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
 * Subscribe to messages in a room using Server-Sent Events
 * @param roomId The ID of the room to subscribe to
 * @param callback Function to call when messages are updated
 * @returns Unsubscribe function to stop listening for updates
 */
export const subscribeToRoomMessages = (
  roomId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  // Create an EventSource to connect to the SSE endpoint
  const eventSource = new EventSource(`/api/messages/${roomId}/stream`);

  // Handle incoming messages
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.messages) {
        // Transform ISO date strings back to Date objects for compatibility
        const messages = data.messages.map((msg: MessageFromServer) => ({
          ...msg,
          createdAt: msg.createdAt ? new Date(msg.createdAt) : null
        })) as Message[];

        // Call the callback with the updated messages
        callback(messages);
      } else if (data.error) {
        console.error('Error from SSE:', data.error);
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
    }
  };

  // Handle errors
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    // Try to reconnect automatically (the browser will do this by default)
  };

  // Return an unsubscribe function
  return () => {
    eventSource.close();
  };
};
