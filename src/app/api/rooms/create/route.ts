import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { getSession, createSession, addAuthenticatedRoom } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Create a limiter for room creation (5 requests per minute)
// Reduced from 10 to 5 for better security
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

// Input validation schema
const createRoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userName: z.string().optional(),
});

/**
 * Securely hash a password with a random salt using PBKDF2
 * @param password The plain text password to hash
 * @returns Promise resolving to a string in the format "salt:hash"
 * @throws Error if hashing fails
 */
const hashPassword = async (password: string): Promise<string> => {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');

  // Use PBKDF2 for secure password hashing
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      10000, // Number of iterations
      64,    // Key length
      'sha512', // Hash algorithm
      (err, derivedKey) => {
        if (err) reject(err);
        // Store both the salt and the hash
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      }
    );
  });
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 5); // 5 requests per minute (reduced from 10)
    } catch {
      // Log the rate limit exceeded event
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-logger');
      await logSecurityEvent(
        SecurityEventType._RATE_LIMIT_EXCEEDED,
        request,
        { endpoint: 'rooms/create', limit: 5 }
      );

      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get the current session or create a new one
    const session = await getSession();

    // Parse and validate request body
    const body = await request.json();
    const result = createRoomSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, password, userName } = result.data;

    // If user is not logged in and provided a username, create a session for them
    if (!session.isLoggedIn && userName) {
      // Create a new session with the provided username
      await createSession(userName);
    }

    // Hash the password securely
    const passwordHash = await hashPassword(password);

    // Create a new room document
    const roomRef = await adminDb.collection('rooms').add({
      name,
      passwordHash,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.isLoggedIn ? session.userName : (userName || 'Anonymous'),
    });

    // Add the room to the user's authenticated rooms list
    await addAuthenticatedRoom(roomRef.id);

    return NextResponse.json({ roomId: roomRef.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
