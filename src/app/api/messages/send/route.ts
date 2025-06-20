import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import DOMPurify from 'isomorphic-dompurify';
import { getSession, isRoomAuthenticated, createSession } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Create a limiter for message sending (20 messages per minute)
// Reduced from 30 to 20 for better security against spam
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
      await limiter.check(request, 20); // 20 messages per minute (reduced from 30)
    } catch {
      // Log the rate limit exceeded event
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-logger');
      await logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        request,
        { endpoint: 'messages/send', limit: 20 }
      );

      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get the current session
    const session = await getSession();

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

    // If user is not logged in and provided a username, create a session for them
    if (!session.isLoggedIn && userName) {
      await createSession(userName);
    }

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
      // Log the unauthorized access attempt
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-logger');
      await logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        request,
        { 
          roomId,
          userId: session.userId,
          userName: session.userName,
          action: 'send_message_unauthorized'
        }
      );

      return NextResponse.json(
        { error: 'You must be authenticated for this room to send a message' },
        { status: 403 }
      );
    }

    // Check for potential XSS attempts
    const containsSuspiciousContent = /<script|javascript:|on\w+\s*=|data:text\/html/i.test(text);

    // Sanitize the message text to prevent XSS
    const sanitizedText = DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [], // No attributes allowed
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });

    // Log potential XSS attempts
    if (containsSuspiciousContent || sanitizedText !== text) {
      const { logSecurityEvent, SecurityEventType } = await import('@/lib/security-logger');
      await logSecurityEvent(
        SecurityEventType.XSS_ATTEMPT,
        request,
        { 
          roomId,
          userId: session.userId,
          userName: session.userName,
          originalText: text.substring(0, 100) // Log only first 100 chars for privacy
        }
      );
    }

    // Add the message to the database
    await adminDb.collection('messages').add({
      text: sanitizedText,
      roomId,
      userName: session.userName || userName || 'Anonymous',
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: Error | unknown) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
