// Security event types - duplicated from security-logger.ts to avoid importing in Edge Runtime
// These enum values are exported for use in other files
// Prefixed with underscore to indicate they are intentionally unused in this file
export enum SecurityEventType {
  _AUTH_SUCCESS = 'auth_success',
  _AUTH_FAILURE = 'auth_failure',
  _RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  _CSRF_VIOLATION = 'csrf_violation',
  _SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  _API_ABUSE = 'api_abuse',
  _XSS_ATTEMPT = 'xss_attempt',
  _INJECTION_ATTEMPT = 'injection_attempt',
}

/**
 * Log a security event for Edge Runtime
 * This is a simplified version that doesn't use Firebase Admin
 * It only logs to console in Edge Runtime
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  request: Request,
  details?: Record<string, unknown>,
  userId?: string,
  userName?: string
) {
  try {
    // Extract request information
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log to console for Edge Runtime
    console.log(`[SECURITY-EDGE] ${type}:`, {
      path,
      ip,
      userId,
      userName,
      details,
      userAgent,
    });

    return true;
  } catch (error: unknown) {
    console.error('Error logging security event in Edge Runtime:', error);
    return false;
  }
}
