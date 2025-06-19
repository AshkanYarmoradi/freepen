import { SecurityEventType, logSecurityEvent } from '../../lib/edge-security-logger';

describe('edge-security-logger', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  // Mock console methods
  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
  });
  
  // Restore original console methods
  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  it('should log security events correctly', async () => {
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
    
    // Verify console.log was called with correct parameters
    expect(console.log).toHaveBeenCalledWith(
      '[SECURITY-EDGE] auth_success:',
      expect.objectContaining({
        path: '/api/test',
        ip: '192.168.1.1',
        userId: 'test-user-id',
        userName: 'Test User',
        details: { action: 'test_action' },
        userAgent: 'Jest Test Agent'
      })
    );
  });
  
  it('should handle missing headers gracefully', async () => {
    // Create mock request with missing headers
    const mockRequest = {
      url: 'https://example.com/api/test',
      headers: new Map()
    } as unknown as Request;
    
    // Call the function
    const result = await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      mockRequest
    );
    
    // Verify result
    expect(result).toBe(true);
    
    // Verify console.log was called with correct parameters
    expect(console.log).toHaveBeenCalledWith(
      '[SECURITY-EDGE] suspicious_activity:',
      expect.objectContaining({
        path: '/api/test',
        ip: 'unknown',
        userAgent: 'unknown'
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
      'Error logging security event in Edge Runtime:',
      expect.anything()
    );
  });
  
  it('should support all security event types', async () => {
    // Create mock request
    const mockRequest = {
      url: 'https://example.com/api/test',
      headers: new Map()
    } as unknown as Request;
    
    // Test each security event type
    for (const eventType of Object.values(SecurityEventType)) {
      // Reset mock
      jest.clearAllMocks();
      
      // Call the function
      const result = await logSecurityEvent(eventType, mockRequest);
      
      // Verify result
      expect(result).toBe(true);
      
      // Verify console.log was called with correct event type
      expect(console.log).toHaveBeenCalledWith(
        `[SECURITY-EDGE] ${eventType}:`,
        expect.anything()
      );
    }
  });
});