import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import DOMPurify from 'isomorphic-dompurify';
import { getSession, isRoomAuthenticated } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Create a limiter for message sending (30 messages per minute)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

// Input validation schema
const sendMessageSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  text: z.string().min(1, 'Message text is required').max(1000, 'Message is too long'),
  userName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 30); // 30 messages per minute
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
        { error: 'You must be logged in to send a message' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = sendMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { roomId, text, userName } = result.data;

    // Verify that the room exists
    const roomDoc = await adminDb.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    // Check if the user is authenticated for this room
    if (!isRoomAuthenticated(session, roomId)) {
      return NextResponse.json(
        { error: 'You must be authenticated for this room to send a message' },
        { status: 403 }
      );
    }

    // Sanitize the message text to prevent XSS
    const sanitizedText = DOMPurify.sanitize(text);

    // Add the message to the database
    await adminDb.collection('messages').add({
      text: sanitizedText,
      roomId,
      userName: session.userName || 'Anonymous',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
