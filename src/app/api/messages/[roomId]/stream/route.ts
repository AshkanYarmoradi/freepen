import { NextRequest } from 'next/server';
import { getSession, isRoomAuthenticated } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';

// SSE handler for streaming messages in real-time
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const roomId = (await params).roomId;
  
  // Get the current session
  const session = await getSession();
  
  // Check if the user is authenticated for this room
  if (!isRoomAuthenticated(session, roomId)) {
    return new Response(
      JSON.stringify({ error: 'You must be authenticated for this room to view messages' }),
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
  
  // Verify that the room exists
  const roomDoc = await adminDb.collection('rooms').doc(roomId).get();
  if (!roomDoc.exists) {
    return new Response(
      JSON.stringify({ error: 'Room not found' }),
      { 
        status: 404,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }

  // Create a new ReadableStream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Function to send messages to the client
      const sendMessages = async () => {
        try {
          // Fetch messages for the room
          const messagesSnapshot = await adminDb
            .collection('messages')
            .where('roomId', '==', roomId)
            .orderBy('createdAt', 'asc')
            .get();
          
          // Transform the messages to the expected format
          const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Convert Firestore Timestamp to serializable format
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate().toISOString() : null
          }));
          
          // Send the messages as an SSE event
          controller.enqueue(`data: ${JSON.stringify({ messages })}\n\n`);
        } catch (error) {
          console.error('Error fetching messages for SSE:', error);
          controller.enqueue(`data: ${JSON.stringify({ error: 'Failed to fetch messages' })}\n\n`);
        }
      };

      // Send initial messages
      await sendMessages();

      // Set up a real-time listener for new messages
      const unsubscribe = adminDb
        .collection('messages')
        .where('roomId', '==', roomId)
        .orderBy('createdAt', 'asc')
        .onSnapshot(async (snapshot) => {
          // Only send updates if there are changes
          if (!snapshot.empty) {
            await sendMessages();
          }
        }, (error) => {
          console.error('Error in Firestore onSnapshot:', error);
          controller.enqueue(`data: ${JSON.stringify({ error: 'Subscription error' })}\n\n`);
        });

      // Clean up the listener when the client disconnects
      request.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    }
  });

  // Return the stream as an SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}