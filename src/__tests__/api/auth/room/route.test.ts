import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/auth/room/route';
import { getSession, addAuthenticatedRoom, isRoomAuthenticated } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-logger';
import { adminDb } from '@/lib/firebase-admin';

// Mock dependencies
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  addAuthenticatedRoom: jest.fn(),
  isRoomAuthenticated: jest.fn(),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockReturnValue({
    check: jest.fn(),
  }),
}));

jest.mock('@/lib/security-logger', () => ({
  logSecurityEvent: jest.fn(),
  SecurityEventType: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    CSRF_VIOLATION: 'CSRF_VIOLATION',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
    AUTHENTICATION_SUCCESS: 'AUTHENTICATION_SUCCESS',
  },
}));

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  },
}));

// Mock crypto for password verification
jest.mock('crypto', () => ({
  pbkdf2: jest.fn((password, salt, iterations, keylen, digest, callback) => {
    // Simple mock implementation that returns the password as the hash
    // In a real test, you'd want to match this with your test data
    callback(null, {
      toString: () => 'mocked-hash',
    });
  }),
}));

describe('Room Authentication API', () => {
  let mockRequest: Partial<NextRequest>;
  let mockSession: any;
  let mockRoomDoc: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock request
    mockRequest = {
      json: jest.fn().mockResolvedValue({
        roomId: 'test-room-id',
        password: 'test-password',
        csrfToken: 'test-csrf-token',
        name: 'Test User',
      }),
    };
    
    // Setup mock session
    mockSession = {
      isLoggedIn: true,
      userId: 'test-user-id',
      userName: 'Test User',
      csrfToken: 'test-csrf-token',
      authenticatedRooms: [],
    };
    
    // Setup mock room document
    mockRoomDoc = {
      exists: true,
      data: jest.fn().mockReturnValue({
        passwordHash: 'mocked-hash',
        name: 'Test Room',
      }),
    };
    
    // Setup mocks
    (getSession as jest.Mock).mockResolvedValue(mockSession);
    (isRoomAuthenticated as jest.Mock).mockReturnValue(false);
    (adminDb.collection('').doc('').get as jest.Mock).mockResolvedValue(mockRoomDoc);
  });
  
  describe('POST', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      // Setup rate limit exceeded
      const mockLimiter = rateLimit('');
      (mockLimiter.check as jest.Mock).mockRejectedValue(new Error('Rate limit exceeded'));
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(429);
      expect(responseData.error).toContain('Rate limit exceeded');
      expect(logSecurityEvent).toHaveBeenCalled();
    });
    
    it('should return 401 when user is not logged in', async () => {
      // Setup user not logged in
      mockSession.isLoggedIn = false;
      (getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(401);
      expect(responseData.error).toContain('must be logged in');
    });
    
    it('should return 403 when CSRF token is invalid', async () => {
      // Setup invalid CSRF token
      mockSession.csrfToken = 'different-csrf-token';
      (getSession as jest.Mock).mockResolvedValue(mockSession);
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(403);
      expect(responseData.error).toContain('Invalid CSRF token');
      expect(logSecurityEvent).toHaveBeenCalled();
    });
    
    it('should return success when room is already authenticated', async () => {
      // Setup room already authenticated
      (isRoomAuthenticated as jest.Mock).mockReturnValue(true);
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.authenticated).toBe(true);
      expect(responseData.roomId).toBe('test-room-id');
    });
    
    it('should return 404 when room does not exist', async () => {
      // Setup room not found
      mockRoomDoc.exists = false;
      (adminDb.collection('').doc('').get as jest.Mock).mockResolvedValue(mockRoomDoc);
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(404);
      expect(responseData.error).toContain('Room not found');
      expect(logSecurityEvent).toHaveBeenCalled();
    });
    
    // Add more tests for password verification, authentication success, etc.
  });
  
  describe('GET', () => {
    it('should return authentication status for a room', async () => {
      // Setup URL with roomId parameter
      mockRequest.nextUrl = new URL('https://example.com/api/auth/room?roomId=test-room-id');
      
      // Setup room is authenticated
      (isRoomAuthenticated as jest.Mock).mockReturnValue(true);
      
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.authenticated).toBe(true);
      expect(responseData.roomId).toBe('test-room-id');
    });
    
    it('should return not authenticated when room is not authenticated', async () => {
      // Setup URL with roomId parameter
      mockRequest.nextUrl = new URL('https://example.com/api/auth/room?roomId=test-room-id');
      
      // Setup room is not authenticated
      (isRoomAuthenticated as jest.Mock).mockReturnValue(false);
      
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(200);
      expect(responseData.authenticated).toBe(false);
      expect(responseData.roomId).toBe('test-room-id');
    });
    
    it('should return 400 when roomId is missing', async () => {
      // Setup URL without roomId parameter
      mockRequest.nextUrl = new URL('https://example.com/api/auth/room');
      
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();
      
      expect(response.status).toBe(400);
      expect(responseData.error).toContain('roomId is required');
    });
  });
});