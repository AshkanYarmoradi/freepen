import { middleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';
import { SecurityEventType } from '../lib/edge-security-logger';

// Mock next/server
jest.mock('next/server', () => {
  return {
    NextResponse: {
      next: jest.fn().mockReturnValue({
        headers: {
          set: jest.fn(),
        },
      }),
      json: jest.fn().mockImplementation((body, options) => ({
        body,
        ...options,
      })),
    },
    NextRequest: jest.fn(),
  };
});

// Mock edge-security-logger
jest.mock('../lib/edge-security-logger', () => {
  return {
    SecurityEventType: {
      CSRF_VIOLATION: 'csrf_violation',
    },
    logSecurityEvent: jest.fn().mockResolvedValue(true),
  };
});

// Import mocks after they've been set up
import { logSecurityEvent } from '../lib/edge-security-logger';

describe('middleware', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it('should add security headers to all responses', async () => {
    // Create a mock request
    const mockRequest = {
      nextUrl: {
        pathname: '/',
      },
      headers: new Map(),
    } as unknown as NextRequest;

    // Call the middleware
    const response = await middleware(mockRequest);

    // Verify security headers were added
    expect(NextResponse.next).toHaveBeenCalled();
    expect(response.headers.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(response.headers.set).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    expect(response.headers.set).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
  });

  it('should allow non-API requests without CSRF checks', async () => {
    // Create a mock request for a non-API path
    const mockRequest = {
      nextUrl: {
        pathname: '/some-page',
      },
      method: 'POST',
      headers: new Map([
        ['host', 'example.com'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    await middleware(mockRequest);

    // Verify CSRF check was not performed (logSecurityEvent not called)
    expect(logSecurityEvent).not.toHaveBeenCalled();
  });

  it('should allow API GET requests without CSRF checks', async () => {
    // Create a mock request for an API GET request
    const mockRequest = {
      nextUrl: {
        pathname: '/api/some-endpoint',
      },
      method: 'GET',
      headers: new Map([
        ['host', 'example.com'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    await middleware(mockRequest);

    // Verify CSRF check was not performed (logSecurityEvent not called)
    expect(logSecurityEvent).not.toHaveBeenCalled();
  });

  it('should reject API write requests with no origin or referer', async () => {
    // Create a mock request for an API POST request with no origin or referer
    const mockRequest = {
      nextUrl: {
        pathname: '/api/some-endpoint',
      },
      method: 'POST',
      headers: new Map([
        ['host', 'example.com'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    const response = await middleware(mockRequest);

    // Verify request was rejected
    expect(logSecurityEvent).toHaveBeenCalledWith(
      SecurityEventType.CSRF_VIOLATION,
      mockRequest,
      { message: 'No origin or referer', path: '/api/some-endpoint' }
    );
    expect(response.body).toEqual({ error: 'CSRF protection: No origin or referer' });
    expect(response.status).toBe(403);
  });

  it('should reject API write requests with mismatched origin', async () => {
    // Create a mock request for an API POST request with mismatched origin
    const mockRequest = {
      nextUrl: {
        pathname: '/api/some-endpoint',
      },
      method: 'POST',
      headers: new Map([
        ['host', 'example.com'],
        ['origin', 'https://malicious-site.com'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    const response = await middleware(mockRequest);

    // Verify request was rejected
    expect(logSecurityEvent).toHaveBeenCalledWith(
      SecurityEventType.CSRF_VIOLATION,
      mockRequest,
      { 
        message: 'Invalid origin or referer', 
        path: '/api/some-endpoint',
        origin: 'https://malicious-site.com',
        referer: undefined,
        host: 'example.com'
      }
    );
    expect(response.body).toEqual({ error: 'CSRF protection: Invalid origin or referer' });
    expect(response.status).toBe(403);
  });

  it('should reject API write requests with mismatched referer', async () => {
    // Create a mock request for an API POST request with mismatched referer
    const mockRequest = {
      nextUrl: {
        pathname: '/api/some-endpoint',
      },
      method: 'POST',
      headers: new Map([
        ['host', 'example.com'],
        ['referer', 'https://malicious-site.com/page'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    const response = await middleware(mockRequest);

    // Verify request was rejected
    expect(logSecurityEvent).toHaveBeenCalledWith(
      SecurityEventType.CSRF_VIOLATION,
      mockRequest,
      { 
        message: 'Invalid origin or referer', 
        path: '/api/some-endpoint',
        origin: undefined,
        referer: 'https://malicious-site.com/page',
        host: 'example.com'
      }
    );
    expect(response.body).toEqual({ error: 'CSRF protection: Invalid origin or referer' });
    expect(response.status).toBe(403);
  });

  it('should allow API write requests with matching origin', async () => {
    // Create a mock request for an API POST request with matching origin
    const mockRequest = {
      nextUrl: {
        pathname: '/api/some-endpoint',
      },
      method: 'POST',
      headers: new Map([
        ['host', 'example.com'],
        ['origin', 'https://example.com'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    await middleware(mockRequest);

    // Verify request was allowed (logSecurityEvent not called for CSRF violation)
    expect(logSecurityEvent).not.toHaveBeenCalled();
  });

  it('should allow API write requests with matching referer', async () => {
    // Create a mock request for an API POST request with matching referer
    const mockRequest = {
      nextUrl: {
        pathname: '/api/some-endpoint',
      },
      method: 'POST',
      headers: new Map([
        ['host', 'example.com'],
        ['referer', 'https://example.com/page'],
      ]),
    } as unknown as NextRequest;

    // Call the middleware
    await middleware(mockRequest);

    // Verify request was allowed (logSecurityEvent not called for CSRF violation)
    expect(logSecurityEvent).not.toHaveBeenCalled();
  });

  it('should check all write methods (POST, PUT, DELETE, PATCH)', async () => {
    const writeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of writeMethods) {
      // Reset mocks
      jest.clearAllMocks();
      
      // Create a mock request for an API write request with no origin or referer
      const mockRequest = {
        nextUrl: {
          pathname: '/api/some-endpoint',
        },
        method,
        headers: new Map([
          ['host', 'example.com'],
        ]),
      } as unknown as NextRequest;

      // Call the middleware
      await middleware(mockRequest);

      // Verify CSRF check was performed
      expect(logSecurityEvent).toHaveBeenCalledWith(
        SecurityEventType.CSRF_VIOLATION,
        mockRequest,
        expect.objectContaining({ message: 'No origin or referer' })
      );
    }
  });
});