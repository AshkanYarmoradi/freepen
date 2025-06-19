import { SecurityEventType, logSecurityEvent, checkSuspiciousIP, getUserSecurityEvents } from '../../lib/security-logger';

// Mock firebase-admin
jest.mock('../../lib/firebase-admin', () => {
  // Create mock functions
  const addMock = jest.fn().mockResolvedValue({ id: 'mock-doc-id' });
  const getMock = jest.fn().mockResolvedValue({
    size: 0,
    docs: [],
  });
  const whereMock = jest.fn().mockReturnThis();
  const orderByMock = jest.fn().mockReturnThis();
  const limitMock = jest.fn().mockReturnThis();

  // Create mock collection
  const collectionMock = jest.fn().mockReturnValue({
    add: addMock,
    where: whereMock,
    orderBy: orderByMock,
    limit: limitMock,
    get: getMock,
  });

  return {
    adminDb: {
      collection: collectionMock,
    },
  };
});

// Mock firebase-admin/firestore
jest.mock('firebase-admin/firestore', () => {
  return {
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
    },
    Timestamp: jest.fn(),
  };
});

// Import mocks after they've been set up
import { adminDb } from '../../lib/firebase-admin';

describe('security-logger', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  // Mock console methods
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  // Restore original console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('logSecurityEvent', () => {
    it('should log security events to Firestore and console', async () => {
      // Create mock request
      const mockRequest = {
        url: 'https://example.com/api/test',
        headers: new Map([
          ['x-forwarded-for', '192.168.1.1'],
          ['user-agent', 'Jest Test Agent']
        ])
      } as unknown as Request;

      // Test details
      const details = { action: 'test_action' };
      const userId = 'test-user-id';
      const userName = 'Test User';

      // Call the function
      const result = await logSecurityEvent(
        SecurityEventType.AUTH_SUCCESS,
        mockRequest,
        details,
        userId,
        userName
      );

      // Verify result
      expect(result).toBe(true);

      // Verify Firestore was called correctly
      expect(adminDb.collection).toHaveBeenCalledWith('securityLogs');
      expect(adminDb.collection('securityLogs').add).toHaveBeenCalledWith({
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'test-user-id',
        userName: 'Test User',
        ip: '192.168.1.1',
        userAgent: 'Jest Test Agent',
        path: '/api/test',
        details: { action: 'test_action' },
        timestamp: 'mock-timestamp',
      });

      // Verify console.log was called
      expect(console.log).toHaveBeenCalledWith(
        '[SECURITY] auth_success:',
        expect.objectContaining({
          path: '/api/test',
          ip: '192.168.1.1',
          userId: 'test-user-id',
          userName: 'Test User',
          details: { action: 'test_action' },
        })
      );
    });

    it('should handle errors gracefully', async () => {
      // Create invalid request to trigger an error
      const invalidRequest = null as unknown as Request;

      // Call the function
      const result = await logSecurityEvent(
        SecurityEventType.AUTH_FAILURE,
        invalidRequest
      );

      // Verify result
      expect(result).toBe(false);

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error logging security event:',
        expect.anything()
      );

      // Verify Firestore was not called
      expect(adminDb.collection('securityLogs').add).not.toHaveBeenCalled();
    });
  });

  describe('checkSuspiciousIP', () => {
    it('should return false for non-suspicious IPs', async () => {
      // Mock Firestore to return 0 suspicious events
      (adminDb.collection('securityLogs').get as jest.Mock).mockResolvedValueOnce({
        size: 0,
        docs: [],
      });

      // Call the function
      const result = await checkSuspiciousIP('192.168.1.1');

      // Verify result
      expect(result).toBe(false);

      // Verify Firestore was called correctly
      expect(adminDb.collection).toHaveBeenCalledWith('securityLogs');
      expect(adminDb.collection('securityLogs').where).toHaveBeenCalledWith('ip', '==', '192.168.1.1');
    });

    it('should return true for suspicious IPs', async () => {
      // Mock Firestore to return 5 suspicious events
      (adminDb.collection('securityLogs').get as jest.Mock).mockResolvedValueOnce({
        size: 5,
        docs: Array(5).fill({}),
      });

      // Call the function
      const result = await checkSuspiciousIP('192.168.1.2');

      // Verify result
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      // Mock Firestore to throw an error
      (adminDb.collection('securityLogs').get as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      // Call the function
      const result = await checkSuspiciousIP('192.168.1.3');

      // Verify result
      expect(result).toBe(false);

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error checking suspicious IP:',
        expect.anything()
      );
    });
  });

  describe('getUserSecurityEvents', () => {
    it('should return user security events', async () => {
      // Mock data
      const mockDocs = [
        { id: 'event1', data: () => ({ type: SecurityEventType.AUTH_SUCCESS, timestamp: new Date() }) },
        { id: 'event2', data: () => ({ type: SecurityEventType.AUTH_FAILURE, timestamp: new Date() }) },
      ];

      // Mock Firestore to return the mock docs
      (adminDb.collection('securityLogs').get as jest.Mock).mockResolvedValueOnce({
        docs: mockDocs,
      });

      // Call the function
      const result = await getUserSecurityEvents('test-user-id');

      // Verify result
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event1');
      expect(result[0].type).toBe(SecurityEventType.AUTH_SUCCESS);
      expect(result[1].id).toBe('event2');
      expect(result[1].type).toBe(SecurityEventType.AUTH_FAILURE);

      // Verify Firestore was called correctly
      expect(adminDb.collection).toHaveBeenCalledWith('securityLogs');
      expect(adminDb.collection('securityLogs').where).toHaveBeenCalledWith('userId', '==', 'test-user-id');
      expect(adminDb.collection('securityLogs').orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(adminDb.collection('securityLogs').limit).toHaveBeenCalledWith(100);
    });

    it('should respect the limit parameter', async () => {
      // Mock Firestore
      (adminDb.collection('securityLogs').get as jest.Mock).mockResolvedValueOnce({
        docs: [],
      });

      // Call the function with custom limit
      await getUserSecurityEvents('test-user-id', 50);

      // Verify limit was respected
      expect(adminDb.collection('securityLogs').limit).toHaveBeenCalledWith(50);
    });

    it('should handle errors gracefully', async () => {
      // Mock Firestore to throw an error
      (adminDb.collection('securityLogs').get as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

      // Call the function
      const result = await getUserSecurityEvents('test-user-id');

      // Verify result
      expect(result).toEqual([]);

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error getting user security events:',
        expect.anything()
      );
    });
  });
});
