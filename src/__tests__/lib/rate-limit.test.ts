import { rateLimit } from '../../lib/rate-limit';
import { NextRequest } from 'next/server';

describe('rate-limit', () => {
  // Mock NextRequest
  const createMockRequest = (headers: Record<string, string> = {}) => {
    return {
      headers: {
        get: jest.fn((name) => headers[name] || null),
      },
    } as unknown as NextRequest;
  };

  beforeEach(() => {
    // Reset Date.now mock before each test
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('should allow requests within the rate limit', async () => {
    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create a mock request
    const mockRequest = createMockRequest({
      'X-Forwarded-For': '192.168.1.1',
    });

    // Check the rate limit
    const result = await limiter.check(mockRequest, 5);

    // Expect the check to pass
    expect(result).toBe(true);
  });

  it('should reject requests that exceed the rate limit', async () => {
    // Mock Date.now to return a fixed timestamp
    jest.spyOn(Date, 'now').mockImplementation(() => 1000);

    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create a mock request
    const mockRequest = createMockRequest({
      'X-Forwarded-For': '192.168.1.2',
    });

    // Make 3 requests (limit is 3)
    await limiter.check(mockRequest, 3);
    await limiter.check(mockRequest, 3);
    await limiter.check(mockRequest, 3);

    // The 4th request should be rejected
    await expect(limiter.check(mockRequest, 3)).rejects.toThrow('Rate limit exceeded');
  });

  it('should handle different IPs separately', async () => {
    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create mock requests with different IPs
    const request1 = createMockRequest({
      'X-Forwarded-For': '192.168.1.3',
    });
    const request2 = createMockRequest({
      'X-Forwarded-For': '192.168.1.4',
    });

    // Make 3 requests from the first IP (limit is 3)
    await limiter.check(request1, 3);
    await limiter.check(request1, 3);
    await limiter.check(request1, 3);

    // The 4th request from the first IP should be rejected
    await expect(limiter.check(request1, 3)).rejects.toThrow('Rate limit exceeded');

    // But a request from the second IP should be allowed
    const result = await limiter.check(request2, 3);
    expect(result).toBe(true);
  });

  it('should expire tokens after the interval', async () => {
    // Mock Date.now to return increasing timestamps
    let now = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create a mock request
    const mockRequest = createMockRequest({
      'X-Forwarded-For': '192.168.1.5',
    });

    // Make 3 requests (limit is 3)
    await limiter.check(mockRequest, 3);
    await limiter.check(mockRequest, 3);
    await limiter.check(mockRequest, 3);

    // Advance time by 1001ms (just past the interval)
    now += 1001;

    // The 4th request should now be allowed because the first tokens have expired
    const result = await limiter.check(mockRequest, 3);
    expect(result).toBe(true);
  });

  it('should use 127.0.0.1 when X-Forwarded-For is not available', async () => {
    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create a mock request without X-Forwarded-For
    const mockRequest = createMockRequest();

    // Make 5 requests (limit is 5)
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);

    // The 6th request should be rejected
    await expect(limiter.check(mockRequest, 5)).rejects.toThrow('Rate limit exceeded');
  });

  it('should handle empty X-Forwarded-For header', async () => {
    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create a mock request with empty X-Forwarded-For
    const mockRequest = createMockRequest({
      'X-Forwarded-For': '',
    });

    // Make 5 requests (limit is 5)
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);
    await limiter.check(mockRequest, 5);

    // The 6th request should be rejected
    await expect(limiter.check(mockRequest, 5)).rejects.toThrow('Rate limit exceeded');
  });

  it('should handle X-Forwarded-For with multiple IPs', async () => {
    // Create a rate limiter with a 1000ms interval and 10 unique tokens
    const limiter = rateLimit({
      interval: 1000,
      uniqueTokenPerInterval: 10,
    });

    // Create a mock request with multiple IPs in X-Forwarded-For
    const mockRequest = createMockRequest({
      'X-Forwarded-For': '192.168.1.6, 10.0.0.1, 172.16.0.1',
    });

    // Make 3 requests (limit is 3)
    await limiter.check(mockRequest, 3);
    await limiter.check(mockRequest, 3);
    await limiter.check(mockRequest, 3);

    // The 4th request should be rejected
    await expect(limiter.check(mockRequest, 3)).rejects.toThrow('Rate limit exceeded');

    // Create a mock request with a different first IP
    const differentRequest = createMockRequest({
      'X-Forwarded-For': '192.168.1.7, 10.0.0.1, 172.16.0.1',
    });

    // A request from a different IP should be allowed
    const result = await limiter.check(differentRequest, 3);
    expect(result).toBe(true);
  });
});