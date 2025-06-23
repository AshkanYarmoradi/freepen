// Utility functions for end-to-end encryption of messages
// Uses Web Crypto API for client-side encryption/decryption

/**
 * Derives an encryption key from a password using PBKDF2
 * @param password The password to derive the key from
 * @param salt The salt to use for key derivation (must be consistent for the same room)
 * @returns Promise resolving to the derived key
 */
export async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
  // Convert password and salt to ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);

  // Import the password as a key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive a key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a message using AES-GCM
 * @param text The plain text message to encrypt
 * @param key The encryption key
 * @returns Promise resolving to an object containing the encrypted message and IV
 */
export async function encryptMessage(text: string, key: CryptoKey): Promise<{ encryptedText: string, iv: string }> {
  // Generate a random IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Convert the message to ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Encrypt the message
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );

  // Convert the encrypted data and IV to base64 strings
  const encryptedText = arrayBufferToBase64(encryptedBuffer);
  const ivString = arrayBufferToBase64(iv);

  return { encryptedText, iv: ivString };
}

/**
 * Decrypts a message using AES-GCM
 * @param encryptedText The encrypted message as a base64 string
 * @param iv The initialization vector as a base64 string
 * @param key The decryption key
 * @returns Promise resolving to the decrypted message
 */
export async function decryptMessage(encryptedText: string, iv: string, key: CryptoKey): Promise<string> {
  try {
    // Convert the encrypted data and IV from base64 to ArrayBuffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedText);
    const ivBuffer = base64ToArrayBuffer(iv);

    // Decrypt the message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      encryptedBuffer
    );

    // Convert the decrypted data to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting message:', error);
    return '[Encrypted message - cannot decrypt]';
  }
}

/**
 * Converts an ArrayBuffer or Uint8Array to a base64 string
 * @param buffer The ArrayBuffer or Uint8Array to convert
 * @returns The base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Converts a base64 string to an ArrayBuffer
 * @param base64 The base64 string to convert
 * @returns The ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Stores the encryption key for a room in session storage
 * @param roomId The ID of the room
 * @param key The encryption key
 */
export function storeRoomKey(roomId: string, key: CryptoKey): void {
  // We can't directly store CryptoKey objects, so we'll store a flag indicating
  // that we have a key for this room. The actual key is kept in memory.
  sessionStorage.setItem(`room_key_${roomId}`, 'true');

  // Store the key in a global variable
  if (!window.roomKeys) {
    window.roomKeys = {};
  }
  window.roomKeys[roomId] = key;
}

/**
 * Retrieves the encryption key for a room from session storage
 * @param roomId The ID of the room
 * @returns The encryption key or null if not found
 */
export function getRoomKey(roomId: string): CryptoKey | null {
  const hasKey = sessionStorage.getItem(`room_key_${roomId}`);
  if (!hasKey) return null;

  // Retrieve the key from the global variable
  if (!window.roomKeys) return null;
  return window.roomKeys[roomId] || null;
}

// Add type definition for the global roomKeys object
declare global {
  interface Window {
    roomKeys?: Record<string, CryptoKey>;
  }
}
