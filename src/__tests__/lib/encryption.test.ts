import { deriveKey, encryptMessage, decryptMessage, storeRoomKey, getRoomKey } from '@/lib/encryption';

// Mock the Web Crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
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

// Mock TextEncoder and TextDecoder
global.TextEncoder = jest.fn().mockImplementation(() => ({
  encode: jest.fn((str) => new Uint8Array([...str].map((c) => c.charCodeAt(0)))),
}));

global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: jest.fn((buffer) => {
    const arr = new Uint8Array(buffer);
    return String.fromCharCode.apply(null, Array.from(arr));
  }),
}));

describe('Encryption Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.clear();
    
    // Reset window.roomKeys
    if (window.roomKeys) {
      window.roomKeys = {};
    }
  });

  describe('deriveKey', () => {
    it('should derive a key from a password and salt', async () => {
      // Mock the crypto.subtle.importKey and deriveKey methods
      const mockImportedKey = {} as CryptoKey;
      const mockDerivedKey = {} as CryptoKey;
      
      mockCrypto.subtle.importKey.mockResolvedValueOnce(mockImportedKey);
      mockCrypto.subtle.deriveKey.mockResolvedValueOnce(mockDerivedKey);
      
      // Call deriveKey
      const result = await deriveKey('password123', 'salt123');
      
      // Check that importKey was called with the correct arguments
      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array), // password buffer
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      // Check that deriveKey was called with the correct arguments
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalledWith(
        {
          name: 'PBKDF2',
          salt: expect.any(Uint8Array), // salt buffer
          iterations: 100000,
          hash: 'SHA-256'
        },
        mockImportedKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Check that the result is the mock derived key
      expect(result).toBe(mockDerivedKey);
    });
    
    it('should handle errors during key derivation', async () => {
      // Mock the crypto.subtle.importKey method to throw an error
      mockCrypto.subtle.importKey.mockRejectedValueOnce(new Error('Import key failed'));
      
      // Call deriveKey and expect it to reject
      await expect(deriveKey('password123', 'salt123')).rejects.toThrow('Import key failed');
    });
  });

  describe('encryptMessage', () => {
    it('should encrypt a message using AES-GCM', async () => {
      // Mock the crypto.subtle.encrypt method
      const mockEncryptedBuffer = new ArrayBuffer(10);
      mockCrypto.subtle.encrypt.mockResolvedValueOnce(mockEncryptedBuffer);
      
      // Create a mock key
      const mockKey = {} as CryptoKey;
      
      // Call encryptMessage
      const result = await encryptMessage('Hello, world!', mockKey);
      
      // Check that getRandomValues was called to generate an IV
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
      
      // Check that encrypt was called with the correct arguments
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(Uint8Array)
        },
        mockKey,
        expect.any(Uint8Array) // text buffer
      );
      
      // Check that the result has the expected properties
      expect(result).toHaveProperty('encryptedText');
      expect(result).toHaveProperty('iv');
      expect(typeof result.encryptedText).toBe('string');
      expect(typeof result.iv).toBe('string');
    });
    
    it('should handle encryption errors', async () => {
      // Mock the crypto.subtle.encrypt method to throw an error
      mockCrypto.subtle.encrypt.mockRejectedValueOnce(new Error('Encryption failed'));
      
      // Create a mock key
      const mockKey = {} as CryptoKey;
      
      // Call encryptMessage and expect it to reject
      await expect(encryptMessage('Hello, world!', mockKey)).rejects.toThrow('Encryption failed');
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt an encrypted message', async () => {
      // Mock the crypto.subtle.decrypt method
      const mockDecryptedBuffer = new Uint8Array([72, 101, 108, 108, 111]).buffer; // "Hello"
      mockCrypto.subtle.decrypt.mockResolvedValueOnce(mockDecryptedBuffer);
      
      // Create a mock key
      const mockKey = {} as CryptoKey;
      
      // Call decryptMessage
      const result = await decryptMessage('encryptedTextBase64', 'ivBase64', mockKey);
      
      // Check that decrypt was called with the correct arguments
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv: expect.any(ArrayBuffer)
        },
        mockKey,
        expect.any(ArrayBuffer)
      );
      
      // Check that the result is the decrypted text
      expect(result).toBe('Hello');
    });
    
    it('should handle decryption errors gracefully', async () => {
      // Mock the crypto.subtle.decrypt method to throw an error
      mockCrypto.subtle.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));
      
      // Create a mock key
      const mockKey = {} as CryptoKey;
      
      // Call decryptMessage
      const result = await decryptMessage('encryptedTextBase64', 'ivBase64', mockKey);
      
      // Check that the result is the error message
      expect(result).toBe('[Encrypted message - cannot decrypt]');
    });
  });

  describe('storeRoomKey and getRoomKey', () => {
    it('should store and retrieve a room key', () => {
      // Create a mock key
      const mockKey = {} as CryptoKey;
      const roomId = 'test-room-id';
      
      // Store the key
      storeRoomKey(roomId, mockKey);
      
      // Check that sessionStorage.setItem was called with the correct arguments
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(`room_key_${roomId}`, 'true');
      
      // Check that window.roomKeys was initialized and the key was stored
      expect(window.roomKeys).toBeDefined();
      expect(window.roomKeys![roomId]).toBe(mockKey);
      
      // Retrieve the key
      const retrievedKey = getRoomKey(roomId);
      
      // Check that sessionStorage.getItem was called with the correct arguments
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(`room_key_${roomId}`);
      
      // Check that the retrieved key is the same as the stored key
      expect(retrievedKey).toBe(mockKey);
    });
    
    it('should return null if no key is stored for the room', () => {
      const roomId = 'nonexistent-room-id';
      
      // Retrieve a key for a room that doesn't have one
      const retrievedKey = getRoomKey(roomId);
      
      // Check that sessionStorage.getItem was called with the correct arguments
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith(`room_key_${roomId}`);
      
      // Check that the retrieved key is null
      expect(retrievedKey).toBeNull();
    });
    
    it('should return null if window.roomKeys is not initialized', () => {
      const roomId = 'test-room-id';
      
      // Set the flag in sessionStorage but don't initialize window.roomKeys
      mockSessionStorage.setItem(`room_key_${roomId}`, 'true');
      window.roomKeys = undefined;
      
      // Retrieve the key
      const retrievedKey = getRoomKey(roomId);
      
      // Check that the retrieved key is null
      expect(retrievedKey).toBeNull();
    });
  });
});