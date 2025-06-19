import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession, addAuthenticatedRoom, isRoomAuthenticated } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';
import { logSecurityEvent, SecurityEventType } from '@/lib/security-logger';
import { adminDb } from '@/lib/firebase-admin';

// Create a limiter for room authentication (15 requests per minute)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

// Input validation schema
const roomAuthSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  password: z.string().min(1, 'Password is required'),
  csrfToken: z.string().min(1, 'CSRF token is required'),
});

/**
 * Verify a password against a stored hash
 * @param password The plain text password to verify
 * @param storedHash The stored hash in the format "salt:hash"
 * @returns Promise resolving to true if the password matches, false otherwise
 * @throws Error if verification fails
 */
const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  // Extract the salt and hash from the stored value
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    throw new Error('Invalid hash format');
  }

  // Hash the provided password with the same salt
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      10000, // Number of iterations
      64,    // Key length
      'sha512', // Hash algorithm
      (err, derivedKey) => {
        if (err) reject(err);
        // Compare the hashes
        resolve(hash === derivedKey.toString('hex'));
      }
    );
  });
};

// Authenticate for a room
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 15); // 15 requests per minute
    } catch (error) {
      // Add a delay to further discourage brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log rate limit exceeded event
      await logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        request,
        { endpoint: 'room-auth' }
      );

      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get the session
    const session = await getSession();

    // If the user is not logged in, we can't authenticate them for a room
    // because we don't have a session to store the authentication in
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'You must be logged in to authenticate for a room' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = roomAuthSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roomId, password, csrfToken } = result.data;

    // Verify CSRF token
    if (session.csrfToken !== csrfToken) {
      // Log CSRF violation
      await logSecurityEvent(
        SecurityEventType.CSRF_VIOLATION,
        request,
        { 
          providedToken: csrfToken,
          expectedToken: session.csrfToken,
          roomId 
        },
        session.userId,
        session.userName
      );

      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Check if the room is already authenticated
    if (isRoomAuthenticated(session, roomId)) {
      return NextResponse.json({ 
        authenticated: true,
        roomId,
      });
    }

    // Get the room document
    const roomDoc = await adminDb.collection('rooms').doc(roomId).get();

    if (!roomDoc.exists) {
      // Add a delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log suspicious activity - attempting to access non-existent room
      await logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        request,
        { 
          roomId,
          activity: 'access_nonexistent_room' 
        },
        session.userId,
        session.userName
      );

      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const roomData = roomDoc.data();

    // Verify the password
    const isPasswordValid = await verifyPassword(password, roomData.passwordHash);

    if (!isPasswordValid) {
      // Add a delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log authentication failure
      await logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        request,
        { 
          roomId,
          reason: 'incorrect_password' 
        },
        session.userId,
        session.userName
      );

      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Add the room to the authenticated rooms list
    await addAuthenticatedRoom(roomId);

    // Log authentication success
    await logSecurityEvent(
      SecurityEventType.AUTH_SUCCESS,
      request,
      { roomId },
      session.userId,
      session.userName
    );

    return NextResponse.json({ 
      authenticated: true,
      roomId,
    });
  } catch (error: any) {
    console.error('Error authenticating for room:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate for room' },
      { status: 500 }
    );
  }
}

// Check if authenticated for a room
export async function GET(request: NextRequest) {
  try {
    // Get the room ID from the query string
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Get the session
    const session = await getSession();

    // Check if the user is logged in
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { authenticated: false },
        { status: 200 }
      );
    }

    // Check if the room is authenticated
    const authenticated = isRoomAuthenticated(session, roomId);

    return NextResponse.json({ authenticated });
  } catch (error: any) {
    console.error('Error checking room authentication:', error);
    return NextResponse.json(
      { error: 'Failed to check room authentication' },
      { status: 500 }
    );
  }
}
