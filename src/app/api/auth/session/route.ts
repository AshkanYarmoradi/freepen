import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSession, getSession } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import DOMPurify from 'isomorphic-dompurify';

// Create a limiter for session creation (10 requests per minute)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

// Input validation schema
const sessionSchema = z.object({
  userName: z.string().min(1, 'User name is required').max(50, 'User name is too long'),
});

// Create a new session
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    try {
      await limiter.check(request, 10); // 10 requests per minute
    } catch (_error) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const result = sessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    // Sanitize the user name to prevent XSS
    const userName = DOMPurify.sanitize(result.data.userName);

    // Create a new session
    const session = await createSession(userName);

    return NextResponse.json({
      userId: session.userId,
      userName: session.userName,
      csrfToken: session.csrfToken,
    });
  } catch (error: Error | unknown) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Get the current session
export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      isLoggedIn: session.isLoggedIn,
      userName: session.userName,
      userId: session.userId,
      csrfToken: session.csrfToken,
    });
  } catch (error: Error | unknown) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
