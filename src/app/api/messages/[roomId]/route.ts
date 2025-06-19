import { NextRequest, NextResponse } from 'next/server';
import { getSession, isRoomAuthenticated } from '@/lib/session';
import { adminDb } from '@/lib/firebase-admin';

// GET handler for fetching messages for a specific room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const roomId = (await params).roomId;
    
    // Get the current session
    const session = await getSession();
    
    // Check if the user is authenticated for this room
    if (!isRoomAuthenticated(session, roomId)) {
      return NextResponse.json(
        { error: 'You must be authenticated for this room to view messages' },
        { status: 403 }
      );
    }
    
    // Verify that the room exists
    const roomDoc = await adminDb.collection('rooms').doc(roomId).get();
    if (!roomDoc.exists) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }
    
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
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}