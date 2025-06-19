import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Define the session data structure
export interface SessionData {
  userId: string;
  userName: string;
  authenticatedRooms: string[];
  isLoggedIn: boolean;
  csrfToken: string;
}

// Define the session options
export const sessionOptions = {
  password: process.env.SESSION_SECRET || (() => {
    // In development, generate a random password if SESSION_SECRET is not set
    if (process.env.NODE_ENV !== 'production') {
      const crypto = require('crypto');
      return crypto.randomBytes(32).toString('hex');
    }
    // In production, throw an error if SESSION_SECRET is not set
    throw new Error('SESSION_SECRET environment variable must be set in production');
  })(),
  cookieName: 'pong_session',
  cookieOptions: {
    // Always set secure to true unless explicitly in development
    secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV !== 'development',
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    // Set an expiration date for the cookie (reduced from 1 week to 24 hours for better security)
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

// Get the session from the request
export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    sessionOptions
  );

  // Initialize the session if it doesn't exist
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
    session.userId = '';
    session.userName = '';
    session.authenticatedRooms = [];
    session.csrfToken = '';
  }

  return session;
}

// Create a new session
export async function createSession(userName: string) {
  const session = await getSession();

  // Generate a random user ID
  const userId = crypto.randomUUID();

  // Generate a CSRF token
  const csrfToken = crypto.randomUUID();

  // Update the session
  session.isLoggedIn = true;
  session.userId = userId;
  session.userName = userName;
  session.authenticatedRooms = [];
  session.csrfToken = csrfToken;

  // Save the session
  await session.save();

  return session;
}

// Add an authenticated room to the session
export async function addAuthenticatedRoom(roomId: string) {
  const session = await getSession();

  if (!session.authenticatedRooms.includes(roomId)) {
    session.authenticatedRooms.push(roomId);
    await session.save();
  }

  return session;
}

// Check if a room is authenticated in the session
export function isRoomAuthenticated(session: SessionData, roomId: string): boolean {
  return session.authenticatedRooms.includes(roomId);
}

// Verify CSRF token
export function verifyCsrfToken(session: SessionData, token: string): boolean {
  return session.csrfToken === token;
}
