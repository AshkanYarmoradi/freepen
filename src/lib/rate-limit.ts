import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

interface RateLimitOptions {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
}

/**
 * Interface for the rate limiter
 */
interface RateLimiter {
  /**
   * Check if the request is within the rate limit
   * @param request The Next.js request object
   * @param limit Maximum number of requests allowed in the interval
   * @returns Promise that resolves to true if within limit, rejects if exceeded
   */
  check: (request: NextRequest, limit: number) => Promise<boolean>;
}

/**
 * Rate limiting utility using LRU cache
 * Limits the number of requests that can be made in a given time interval
 * @param options Configuration options for the rate limiter
 * @returns A rate limiter instance
 */
export function rateLimit(options: RateLimitOptions): RateLimiter {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: async (request: NextRequest, limit: number): Promise<boolean> => {
      const token = getToken(request);
      const now = Date.now();

      // Get the current tokens for this IP
      const tokenCount = tokenCache.get(token) || [];

      // Filter out tokens that are older than the interval
      const validTokens = tokenCount.filter(timestamp => now - timestamp < options.interval);

      // Check if we've exceeded the limit
      if (validTokens.length >= limit) {
        throw new Error('Rate limit exceeded');
      }

      // Add the current timestamp to the token list
      tokenCache.set(token, [...validTokens, now]);

      return true;
    },
  };
}

/**
 * Get a unique token for the request (IP address or other identifier)
 * Uses X-Forwarded-For header if available, otherwise uses IP
 * @param request The Next.js request object
 * @returns A string token that uniquely identifies the client
 */
function getToken(request: NextRequest): string {
  // Try to get the IP from X-Forwarded-For header
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor && forwardedFor.trim() !== '') {
    return forwardedFor.split(',')[0].trim();
  }

  // Fall back to IP from request object
  return '127.0.0.1';
}
