import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { adminDb } from '@/lib/firebase-admin';
import { getSession, createSession, addAuthenticatedRoom } from '@/lib/session';

// Create a limiter for room joining (10 requests per minute)
// More strict than before (reduced from 15 to 10) to prevent brute force attacks
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

// Input validation schema
const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  password: z.string().min(1, 'Password is required'),
  userName: z.string().min(1, 'User name is required'),
});

// Verify password against stored hash
const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  // Extract the salt and hash from the stored value
  const [salt, hash] = storedHash.split(':');

  // Hash the provided password with the same salt
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      // Compare the hashes
      resolve(hash === derivedKey.toString('hex'));
    });
  });
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting - stricter for join attempts to prevent brute force
    try {
      await limiter.check(request, 10); // 10 requests per minute (reduced from 15)
    } catch {
      // Add a delay to further discourage brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the rate limit exceeded event
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-logger');
      await logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        request,
        { endpoint: 'rooms/join', limit: 10 }
      );

      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = joinRoomSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roomId, password, userName } = result.data;

    // Get the room document
    const roomDoc = await adminDb.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      // Add a delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomData = roomDoc.data();

    // Verify the password
    const isPasswordValid = await verifyPassword(password, roomData!.passwordHash);

    if (!isPasswordValid) {
      // Add a delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the authentication failure
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-logger');
      await logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        request,
        { 
          roomId,
          reason: 'Incorrect password',
          userName
        }
      );

      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Get the current session or create a new one
    const session = await getSession();

    // If user is not logged in, create a session for them
    if (!session.isLoggedIn) {
      await createSession(userName);
    } else if (userName && userName.trim() !== '') {
      // Update the userName if provided and user is already logged in
      session.userName = userName.trim();
      await session.save();
    }

    // Add the room to the user's authenticated rooms list
    await addAuthenticatedRoom(roomId);

    // Password is valid, return success with userName
    return NextResponse.json({ 
      roomId,
      name: roomData!.name,
      userName: session.userName,
      success: true 
    });
  } catch (error: unknown) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
}
