# API Directory

This directory contains all the API routes for the freepen application. These routes are implemented using Next.js App Router API routes and follow RESTful principles.

## Directory Structure

- `/auth`: Authentication-related endpoints
  - `/session`: User session management
  - `/room`: Room authentication
- `/messages`: Message handling endpoints
  - `/[roomId]`: Get messages for a specific room
  - `/[roomId]/stream`: Stream real-time messages
  - `/send`: Send a message to a room
- `/rooms`: Room management endpoints
  - `/create`: Create a new chat room
  - `/join`: Join an existing chat room

## Authentication API

### User Session Management

#### `POST /api/auth/session`

Creates a new user session (login).

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "displayName": "User Name"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

**Rate Limiting:** 5 requests per minute per IP address

#### `GET /api/auth/session`

Gets the current user session.

**Response:**
```json
{
  "user": {
    "id": "user123",
    "email": "user@example.com",
    "displayName": "User Name"
  }
}
```

**Unauthenticated Response:**
```json
{
  "user": null
}
```

#### `DELETE /api/auth/session`

Ends the current user session (logout).

**Response:**
```json
{
  "success": true
}
```

### Room Authentication

#### `POST /api/auth/room`

Authenticates to a room with a password.

**Request:**
```json
{
  "roomId": "room123",
  "password": "roompassword"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid room password"
}
```

**Rate Limiting:** 10 requests per minute per user

#### `GET /api/auth/room`

Checks if the user is authenticated to a room.

**Query Parameters:**
- `roomId`: ID of the room to check

**Response:**
```json
{
  "authenticated": true
}
```

**Unauthenticated Response:**
```json
{
  "authenticated": false
}
```

## Messages API

### Get Messages

#### `GET /api/messages/[roomId]`

Gets messages for a specific room.

**URL Parameters:**
- `roomId`: ID of the room to get messages for

**Query Parameters:**
- `limit` (optional): Maximum number of messages to return (default: 50)
- `before` (optional): Timestamp to get messages before (for pagination)

**Response:**
```json
{
  "messages": [
    {
      "id": "msg123",
      "roomId": "room123",
      "userId": "user123",
      "content": "Hello, world!",
      "timestamp": "2023-06-19T12:34:56Z",
      "user": {
        "id": "user123",
        "displayName": "User Name"
      }
    }
  ],
  "hasMore": false
}
```

**Authentication:** Requires room authentication

### Stream Messages

#### `GET /api/messages/[roomId]/stream`

Streams real-time messages for a room using Server-Sent Events (SSE).

**URL Parameters:**
- `roomId`: ID of the room to stream messages for

**Response:** Server-Sent Events with message data

**Event Format:**
```
event: message
data: {"id":"msg123","roomId":"room123","userId":"user123","content":"Hello, world!","timestamp":"2023-06-19T12:34:56Z","user":{"id":"user123","displayName":"User Name"}}
```

**Authentication:** Requires room authentication

### Send Message

#### `POST /api/messages/send`

Sends a message to a room.

**Request:**
```json
{
  "roomId": "room123",
  "content": "Hello, world!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg123"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Not authenticated to this room"
}
```

**Rate Limiting:** 20 messages per minute per user

**Authentication:** Requires room authentication

## Rooms API

### Create Room

#### `POST /api/rooms/create`

Creates a new chat room.

**Request:**
```json
{
  "name": "My Chat Room",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "roomId": "room123"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Room name is required"
}
```

**Rate Limiting:** 5 requests per minute per user

**Authentication:** Requires user authentication

### Join Room

#### `POST /api/rooms/join`

Joins an existing chat room.

**Request:**
```json
{
  "roomId": "room123",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid room ID or password"
}
```

**Rate Limiting:** 10 requests per minute per user

**Authentication:** Requires user authentication

## Implementation Guidelines

### API Route Structure

Each API route should follow this structure:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { createRateLimiter } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-logger';

// Define request schema
const requestSchema = z.object({
  // Schema definition
});

// Create rate limiter
const rateLimiter = createRateLimiter('endpoint_name', 10);

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getSession(request);
    
    // Check authentication if required
    if (!session.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check rate limit
    const { success: rateSuccess, reset } = await rateLimiter.check(session.user.id);
    if (!rateSuccess) {
      // Log rate limit event
      await logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        userId: session.user.id,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: { endpoint: 'endpoint_name' }
      });
      
      return NextResponse.json(
        { success: false, error: `Rate limit exceeded. Try again in ${reset} seconds.` },
        { status: 429, headers: { 'Retry-After': reset.toString() } }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    // Process the request
    // ...
    
    // Return success response
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error in endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Error Handling

All API routes should implement consistent error handling:

1. Use appropriate HTTP status codes
2. Return JSON responses with a consistent structure
3. Include a `success` boolean in all responses
4. Provide meaningful error messages
5. Log errors for debugging and monitoring

### Security Considerations

1. **Input Validation**: Validate all input using Zod schemas
2. **Authentication**: Check authentication for protected routes
3. **Authorization**: Verify permissions for the requested operation
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Security Logging**: Log security-relevant events
6. **CSRF Protection**: Use proper CSRF protection
7. **Content Security**: Sanitize user input to prevent XSS

## Testing API Routes

API routes should be tested using Jest and Supertest:

```typescript
import { createMocks } from 'node-mocks-http';
import { POST } from './route';

describe('POST /api/endpoint', () => {
  it('returns 401 when not authenticated', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { /* test data */ }
    });
    
    const response = await POST(req, res);
    
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      success: false,
      error: 'Authentication required'
    });
  });
  
  // More tests...
});
```

## Client-Side Usage

Example of using the API from client components:

```typescript
// Example: Creating a room
async function createRoom(name: string, password: string) {
  try {
    const response = await fetch('/api/rooms/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, password })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create room');
    }
    
    return data.roomId;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
}

// Example: Using Server-Sent Events
function subscribeToMessages(roomId: string, onMessage: (message: Message) => void) {
  const eventSource = new EventSource(`/api/messages/${roomId}/stream`);
  
  eventSource.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    onMessage(message);
  });
  
  eventSource.addEventListener('error', () => {
    console.error('EventSource failed, reconnecting...');
    eventSource.close();
    setTimeout(() => subscribeToMessages(roomId, onMessage), 1000);
  });
  
  return () => {
    eventSource.close();
  };
}
```