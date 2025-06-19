import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SecurityEventType, logSecurityEvent as logEvent } from './lib/edge-security-logger';

// Use edge-security-logger for middleware (Edge Runtime)
const logSecurityEvent = async (
  type: SecurityEventType,
  request: Request,
  details?: Record<string, unknown>
) => {
  return logEvent(type, request, details);
};

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Add security headers to all responses
  const response = NextResponse.next();

  // Set X-Content-Type-Options header to prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Set X-XSS-Protection header to enable browser's XSS filter
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Set X-Frame-Options header to prevent clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Only apply CSRF protection to API routes
  if (path.startsWith('/api/')) {
    // Get the referer header
    const referer = request.headers.get('referer');

    // Get the origin of the request
    const origin = request.headers.get('origin');

    // Check if the request is a POST, PUT, DELETE, or PATCH request
    const isWriteMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);

    // If it's a write method, check the origin and referer
    if (isWriteMethod) {
      // Get the host from the request
      const host = request.headers.get('host');

      // If there's no origin or referer, or they don't match our host, reject the request
      if (!origin && !referer) {
        // Log the security event
        await logSecurityEvent(
          SecurityEventType.CSRF_VIOLATION,
          request as unknown as Request,
          { message: 'No origin or referer', path }
        );

        return new NextResponse(
          JSON.stringify({ error: 'CSRF protection: No origin or referer' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Check if the origin matches our host
      const originMatches = origin ? origin.includes(host || '') : false;

      // Check if the referer matches our host
      const refererMatches = referer ? referer.includes(host || '') : false;

      // If neither the origin nor the referer match our host, reject the request
      if (!originMatches && !refererMatches) {
        // Log the security event
        await logSecurityEvent(
          SecurityEventType.CSRF_VIOLATION,
          request as unknown as Request,
          { 
            message: 'Invalid origin or referer', 
            path,
            origin,
            referer,
            host
          }
        );

        return new NextResponse(
          JSON.stringify({ error: 'CSRF protection: Invalid origin or referer' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // Continue with the request
  return response;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Apply this middleware to all API routes
    '/api/:path*',
  ],
};
