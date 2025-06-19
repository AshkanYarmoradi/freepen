import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

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
        return new NextResponse(
          JSON.stringify({ error: 'CSRF protection: Invalid origin or referer' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    // Apply this middleware to all API routes
    '/api/:path*',
  ],
};