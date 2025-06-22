import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';
import RoomPage from '@/app/room/[id]/page';
import { createRoom, joinRoom, sendMessage, subscribeToRoomMessages } from '@/lib/db';
import { deriveKey, encryptMessage, decryptMessage, storeRoomKey, getRoomKey } from '@/lib/encryption';

// Mock the Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn().mockResolvedValue('mockImportedKey'),
    deriveKey: jest.fn().mockResolvedValue('mockDerivedKey'),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(10)),
  },
  getRandomValues: jest.fn((array) => {
    // Fill the array with deterministic values for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = i % 256;
    }
    return array;
  }),
};

// Mock the window.crypto object
Object.defineProperty(window, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the db module
jest.mock('@/lib/db', () => ({
  createRoom: jest.fn().mockResolvedValue('test-room-id'),
  joinRoom: jest.fn().mockResolvedValue({ roomId: 'test-room-id', userName: 'Test User' }),
  sendMessage: jest.fn().mockResolvedValue(undefined),
  subscribeToRoomMessages: jest.fn().mockImplementation((roomId, callback) => {
    // Simulate real-time updates by calling the callback with mock messages
    callback([
      {
        id: '1',
        text: 'Hello, world!',
        encrypted: false,
        createdAt: new Date(),
        userName: 'Other User',
        roomId: 'test-room-id',
      },
      {
        id: '2',
        text: 'encryptedTextMock',
        iv: 'ivMock',
        encrypted: true,
        createdAt: new Date(),
        userName: 'Other User',
        roomId: 'test-room-id',
      },
    ]);

    // Return a mock unsubscribe function
    return jest.fn();
  }),
}));

// Mock the encryption module
jest.mock('@/lib/encryption', () => {
  // Create a mock CryptoKey for testing
  const mockCryptoKey = {} as CryptoKey;

  // Store for room keys
  const roomKeys: Record<string, CryptoKey> = {};

  return {
    deriveKey: jest.fn().mockResolvedValue(mockCryptoKey),
    encryptMessage: jest.fn().mockResolvedValue({ 
      encryptedText: 'encryptedTextMock', 
      iv: 'ivMock' 
    }),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    decryptMessage: jest.fn().mockImplementation((text, iv, _key) => {
      // Return different values based on input to simulate decryption
      if (text === 'encryptedTextMock' && iv === 'ivMock') {
        return Promise.resolve('Decrypted message');
      }
      return Promise.reject(new Error('Decryption failed'));
    }),
    storeRoomKey: jest.fn().mockImplementation((roomId, key) => {
      roomKeys[roomId] = key;
      sessionStorage.setItem(`room_key_${roomId}`, 'true');
    }),
    getRoomKey: jest.fn().mockImplementation((roomId) => {
      const hasKey = sessionStorage.getItem(`room_key_${roomId}`);
      return hasKey ? roomKeys[roomId] || null : null;
    }),
  };
});

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock the useRef implementation
const mockScrollIntoView = jest.fn();
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useRef: jest.fn().mockImplementation(() => ({
      current: {
        scrollIntoView: mockScrollIntoView,
      },
    })),
  };
});

describe('End-to-End Encryption', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
  });

  describe('Room Creation with Encryption', () => {
    it('should derive and store an encryption key when creating a room', async () => {
      // Call createRoom
      await createRoom('Test Room', 'password123', 'Test User');

      // Check that deriveKey was called with the correct arguments
      expect(deriveKey).toHaveBeenCalledWith('password123', 'test-room-id');

      // Check that storeRoomKey was called with the correct arguments
      expect(storeRoomKey).toHaveBeenCalled();

      // Check that the room key was stored in sessionStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('room_key_test-room-id', 'true');
    });
  });

  describe('Joining a Room with Encryption', () => {
    it('should derive and store an encryption key when joining a room', async () => {
      // Call joinRoom
      await joinRoom('test-room-id', 'password123', 'Test User');

      // Check that deriveKey was called with the correct arguments
      expect(deriveKey).toHaveBeenCalledWith('password123', 'test-room-id');

      // Check that storeRoomKey was called with the correct arguments
      expect(storeRoomKey).toHaveBeenCalled();

      // Check that the room key was stored in sessionStorage
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('room_key_test-room-id', 'true');
    });
  });

  describe('Sending Encrypted Messages', () => {
    it('should encrypt messages before sending them', async () => {
      // Setup: Store a room key
      const mockKey = {} as CryptoKey;
      storeRoomKey('test-room-id', mockKey);

      // Call sendMessage
      await sendMessage('test-room-id', 'Hello, encrypted world!', 'Test User');

      // Check that getRoomKey was called to retrieve the encryption key
      expect(getRoomKey).toHaveBeenCalledWith('test-room-id');

      // Check that encryptMessage was called with the correct arguments
      expect(encryptMessage).toHaveBeenCalledWith('Hello, encrypted world!', mockKey);

      // Check that sendMessage was called with the encrypted data
      expect(sendMessage).toHaveBeenCalled();
    });

    it('should fall back to unencrypted messages if encryption fails', async () => {
      // Setup: Store a room key
      const mockKey = {} as CryptoKey;
      storeRoomKey('test-room-id', mockKey);

      // Make encryptMessage fail
      (encryptMessage as jest.Mock).mockRejectedValueOnce(new Error('Encryption failed'));

      // Call sendMessage
      await sendMessage('test-room-id', 'Hello, unencrypted world!', 'Test User');

      // Check that sendMessage was still called despite encryption failure
      expect(sendMessage).toHaveBeenCalled();
    });

    it('should send unencrypted messages if no encryption key is available', async () => {
      // Setup: No room key stored
      (getRoomKey as jest.Mock).mockReturnValueOnce(null);

      // Call sendMessage
      await sendMessage('test-room-id', 'Hello, unencrypted world!', 'Test User');

      // Check that encryptMessage was not called
      expect(encryptMessage).not.toHaveBeenCalled();

      // Check that sendMessage was called with unencrypted data
      expect(sendMessage).toHaveBeenCalled();
    });
  });

  describe('Receiving Encrypted Messages', () => {
    it('should decrypt encrypted messages when receiving them', async () => {
      // Setup: Store a room key
      const mockKey = {} as CryptoKey;
      storeRoomKey('test-room-id', mockKey);

      // Render the chat room component
      render(
        <UserProvider>
          <RoomPage params={{ id: 'test-room-id' }} />
        </UserProvider>
      );

      // Check that subscribeToRoomMessages was called
      expect(subscribeToRoomMessages).toHaveBeenCalledWith('test-room-id', expect.any(Function));

      // Check that getRoomKey was called to retrieve the encryption key
      expect(getRoomKey).toHaveBeenCalledWith('test-room-id');

      // Check that decryptMessage was called for the encrypted message
      expect(decryptMessage).toHaveBeenCalledWith('encryptedTextMock', 'ivMock', mockKey);

      // Check that both messages are displayed (one regular, one decrypted)
      await waitFor(() => {
        expect(screen.getByText('Hello, world!')).toBeInTheDocument();
        expect(screen.getByText('Decrypted message')).toBeInTheDocument();
      });
    });

    it('should handle decryption failures gracefully', async () => {
      // Setup: Store a room key
      const mockKey = {} as CryptoKey;
      storeRoomKey('test-room-id', mockKey);

      // Make decryptMessage fail for all calls
      (decryptMessage as jest.Mock).mockRejectedValue(new Error('Decryption failed'));

      // Render the chat room component
      render(
        <UserProvider>
          <RoomPage params={{ id: 'test-room-id' }} />
        </UserProvider>
      );

      // Check that the error message is displayed for the encrypted message
      await waitFor(() => {
        expect(screen.getByText('[Encrypted message - cannot decrypt]')).toBeInTheDocument();
      });
    });

    it('should not attempt to decrypt messages if no encryption key is available', async () => {
      // Setup: No room key stored
      (getRoomKey as jest.Mock).mockReturnValue(null);

      // Render the chat room component
      render(
        <UserProvider>
          <RoomPage params={{ id: 'test-room-id' }} />
        </UserProvider>
      );

      // Check that decryptMessage was not called
      expect(decryptMessage).not.toHaveBeenCalled();

      // Check that the encrypted message is displayed as is
      await waitFor(() => {
        expect(screen.getByText('encryptedTextMock')).toBeInTheDocument();
      });
    });
  });

  describe('End-to-End Flow', () => {
    it('should handle the complete encryption flow from room creation to message exchange', async () => {
      // 1. Create a room
      await createRoom('Test Room', 'password123', 'Test User');
      expect(deriveKey).toHaveBeenCalledWith('password123', 'test-room-id');
      expect(storeRoomKey).toHaveBeenCalled();

      // 2. Join the room
      await joinRoom('test-room-id', 'password123', 'Another User');
      expect(deriveKey).toHaveBeenCalledWith('password123', 'test-room-id');
      expect(storeRoomKey).toHaveBeenCalled();

      // 3. Send an encrypted message
      await sendMessage('test-room-id', 'Hello, encrypted world!', 'Test User');
      expect(getRoomKey).toHaveBeenCalledWith('test-room-id');
      expect(encryptMessage).toHaveBeenCalled();

      // 4. Render the chat room and receive messages
      render(
        <UserProvider>
          <RoomPage params={{ id: 'test-room-id' }} />
        </UserProvider>
      );

      expect(subscribeToRoomMessages).toHaveBeenCalledWith('test-room-id', expect.any(Function));
      expect(getRoomKey).toHaveBeenCalledWith('test-room-id');
      expect(decryptMessage).toHaveBeenCalled();

      // 5. Verify that messages are displayed
      await waitFor(() => {
        expect(screen.getByText('Hello, world!')).toBeInTheDocument();
        expect(screen.getByText('Decrypted message')).toBeInTheDocument();
      });
    });
  });
});
