import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { getSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Create a limiter for room creation (10 requests per minute)
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

// Secure password hashing with salt
const hashPassword = async (password: string): Promise<string> => {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');

  // Use PBKDF2 for secure password hashing
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      // Store both the salt and the hash
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
};

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 10); // 10 requests per minute
    } catch (error) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if the user is logged in
    const session = await getSession();
    if (!session.isLoggedIn) {
      return NextResponse.json(
        { error: 'You must be logged in to create a room' },
        { status: 401 }
      );
    }

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

    // Hash the password securely
    const passwordHash = await hashPassword(password);

    // Create a new room document
    const roomRef = await adminDb.collection('rooms').add({
      name,
      passwordHash,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: session.userName,
    });

    return NextResponse.json({ roomId: roomRef.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}
