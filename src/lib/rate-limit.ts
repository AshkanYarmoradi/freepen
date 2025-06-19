import { NextRequest } from 'next/server';
import { LRUCache } from 'lru-cache';

type Options = {
  interval: number; // milliseconds
  uniqueTokenPerInterval: number;
};

/**
 * Rate limiting utility using LRU cache
 * Limits the number of requests that can be made in a given time interval
 */
export function rateLimit(options: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval,
    ttl: options.interval,
  });

  return {
    check: (request: NextRequest, limit: number) => {
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
 */
function getToken(request: NextRequest): string {
  // Try to get the IP from X-Forwarded-For header
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Fall back to IP
  const ip = request.ip || '127.0.0.1';
  return ip;
}