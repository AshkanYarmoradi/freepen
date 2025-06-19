# Library Directory

This directory contains utility functions, service integrations, and helper modules used throughout the freepen application. These modules provide core functionality that supports the application's features.

## Directory Structure

- `db.ts`: Database utility functions for interacting with Firestore
- `firebase-admin.ts`: Firebase Admin SDK setup for server-side operations
- `firebase.ts`: Firebase client configuration for client-side operations
- `rate-limit.ts`: Rate limiting implementation to prevent abuse
- `security-logger.ts`: Security event logging for monitoring and auditing
- `session.ts`: Session management using Iron Session
- `/utils`: General utility functions used across the application

## Module Documentation

### Database Utilities (`db.ts`)

The database module provides functions for interacting with Firestore:

```typescript
// Example usage
import { createRoom, joinRoom, sendMessage, getMessages } from '@/lib/db';

// Create a new room
const roomId = await createRoom({
  name: 'My Room',
  passwordHash: hashedPassword,
  createdBy: userId
});

// Join a room
await joinRoom(roomId, userId);

// Send a message
await sendMessage(roomId, userId, 'Hello, world!');

// Get messages for a room
const messages = await getMessages(roomId);
```

Key functions:
- `createRoom`: Creates a new chat room with password protection
- `joinRoom`: Adds a user to a room's members
- `sendMessage`: Sends a message to a room
- `getMessages`: Retrieves messages for a room
- `getRoomById`: Gets room details by ID
- `verifyRoomPassword`: Verifies a room password against stored hash

### Firebase Admin (`firebase-admin.ts`)

Server-side Firebase Admin SDK initialization:

```typescript
import { db, auth } from '@/lib/firebase-admin';

// Use Firestore Admin
const doc = await db.collection('rooms').doc(roomId).get();

// Use Auth Admin
const user = await auth.getUser(userId);
```

This module:
- Initializes the Firebase Admin SDK for server-side operations
- Provides access to Firestore Admin and Auth Admin
- Handles credential management securely

### Firebase Client (`firebase.ts`)

Client-side Firebase initialization:

```typescript
import { auth, db } from '@/lib/firebase';

// Use Firebase Auth
await auth.signInWithEmailAndPassword(email, password);

// Use Firestore
const snapshot = await db.collection('rooms').doc(roomId).get();
```

This module:
- Initializes Firebase for client-side use
- Provides access to Firebase Authentication and Firestore
- Configures Firebase based on environment variables

### Rate Limiting (`rate-limit.ts`)

Rate limiting implementation to prevent abuse:

```typescript
import { createRateLimiter } from '@/lib/rate-limit';

// Create a rate limiter for room creation (5 requests per minute)
const rateLimiter = createRateLimiter('room_create', 5);

// Check if request is allowed
const { success, limit, remaining, reset } = await rateLimiter.check(userId);
if (!success) {
  throw new Error(`Rate limit exceeded. Try again in ${reset} seconds.`);
}
```

Features:
- Token bucket algorithm for fair rate limiting
- Configurable limits via environment variables
- Support for both IP-based and user-based rate limiting
- Detailed rate limit information (limit, remaining, reset)

### Security Logger (`security-logger.ts`)

Security event logging for monitoring and auditing:

```typescript
import { logSecurityEvent } from '@/lib/security-logger';

// Log a security event
await logSecurityEvent({
  type: 'AUTHENTICATION_FAILURE',
  userId: userId || null,
  ip: request.headers['x-forwarded-for'] || request.socket.remoteAddress,
  details: {
    reason: 'Invalid password',
    email: email
  }
});
```

Event types:
- `AUTHENTICATION_FAILURE`: Failed login attempts
- `AUTHORIZATION_FAILURE`: Unauthorized access attempts
- `RATE_LIMIT_EXCEEDED`: Rate limit violations
- `INVALID_INPUT`: Potentially malicious input
- `CSRF_VIOLATION`: Cross-Site Request Forgery attempts
- `SESSION_TAMPERING`: Session manipulation attempts

### Session Management (`session.ts`)

Session management using Iron Session:

```typescript
import { getSession, setSession, destroySession } from '@/lib/session';

// Get the current session
const session = await getSession(request, response);

// Set session data
await setSession(request, response, { user: { id: userId, email } });

// Destroy the session
await destroySession(request, response);
```

Features:
- Secure, encrypted cookies using Iron Session
- Session validation and integrity checking
- Automatic CSRF protection
- Configurable session duration
- Room-specific authentication tracking

## Best Practices

### Error Handling

All utility functions should implement proper error handling:

```typescript
try {
  const result = await someFunction();
  return result;
} catch (error) {
  // Log the error
  console.error('Error in someFunction:', error);
  
  // Rethrow with a more user-friendly message
  throw new Error('Operation failed. Please try again later.');
}
```

### Type Safety

Use TypeScript interfaces and types for all functions:

```typescript
interface Room {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  passwordHash: string;
}

async function getRoomById(roomId: string): Promise<Room | null> {
  // Implementation
}
```

### Testing

Write unit tests for all utility functions:

```typescript
// Example test for db.ts
describe('createRoom', () => {
  it('creates a room with the correct data', async () => {
    // Test implementation
  });
  
  it('throws an error if required fields are missing', async () => {
    // Test implementation
  });
});
```

## Adding New Utilities

When adding new utility functions:

1. Place them in the appropriate file based on functionality
2. Create a new file if the functionality doesn't fit existing categories
3. Document the function with JSDoc comments
4. Add appropriate error handling
5. Write unit tests for the new functionality
6. Update this README if necessary

## Security Considerations

- Never expose sensitive credentials in client-side code
- Use environment variables for all secrets
- Implement proper input validation for all functions
- Follow the principle of least privilege
- Log security-relevant events
- Implement rate limiting for potentially abusable functions