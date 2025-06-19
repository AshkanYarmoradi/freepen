// Security event types - duplicated from security-logger.ts to avoid importing in Edge Runtime
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth_success',
  AUTH_FAILURE = 'auth_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  CSRF_VIOLATION = 'csrf_violation',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  API_ABUSE = 'api_abuse',
  XSS_ATTEMPT = 'xss_attempt',
  INJECTION_ATTEMPT = 'injection_attempt',
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