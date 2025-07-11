import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// Security event types
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

// Security event interface
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  userName?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  details?: Record<string, unknown>;
  timestamp: FieldValue | Timestamp;
}

/**
 * Log a security event to Firestore
 * This allows tracking and monitoring of security-related events
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

    // Create the security event
    const event: SecurityEvent = {
      type,
      userId,
      userName,
      ip,
      userAgent,
      path,
      details,
      timestamp: FieldValue.serverTimestamp(),
    };

    // Log to Firestore
    await adminDb.collection('securityLogs').add(event);

    // Also log to console for development
    console.log(`[SECURITY] ${type}:`, {
      path,
      ip,
      userId,
      userName,
      details,
    });

    return true;
  } catch (error: unknown) {
    console.error('Error logging security event:', error);
    return false;
  }
}

/**
 * Check if an IP address has suspicious activity
 * This can be used to implement additional security measures for suspicious IPs
 */
export async function checkSuspiciousIP(ip: string): Promise<boolean> {
  try {
    // Get recent security events for this IP
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const snapshot = await adminDb
      .collection('securityLogs')
      .where('ip', '==', ip)
      .where('type', 'in', [
        SecurityEventType._AUTH_FAILURE,
        SecurityEventType._RATE_LIMIT_EXCEEDED,
        SecurityEventType._CSRF_VIOLATION,
        SecurityEventType._SUSPICIOUS_ACTIVITY,
        SecurityEventType._API_ABUSE,
        SecurityEventType._XSS_ATTEMPT,
        SecurityEventType._INJECTION_ATTEMPT,
      ])
      .where('timestamp', '>=', sixHoursAgo)
      .get();

    // If there are more than 5 suspicious events in the last 6 hours, mark as suspicious
    return snapshot.size >= 5;
  } catch (error: unknown) {
    console.error('Error checking suspicious IP:', error);
    return false;
  }
}

/**
 * Get security events for a specific user
 * This can be used for admin dashboards or security monitoring
 */
export async function getUserSecurityEvents(userId: string, limit = 100) {
  try {
    const snapshot = await adminDb
      .collection('securityLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error: unknown) {
    console.error('Error getting user security events:', error);
    return [];
  }
}
