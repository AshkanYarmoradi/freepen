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
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long',
  cookieName: 'pong_session',
  cookieOptions: {
    // Set secure to true in production
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    // Set an expiration date for the cookie
    maxAge: 60 * 60 * 24 * 7, // 1 week
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
