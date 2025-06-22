import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';
import RoomPage from '@/app/room/[id]/page';
import { sendMessage, subscribeToRoomMessages } from '@/lib/db';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the db module
jest.mock('@/lib/db', () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
  subscribeToRoomMessages: jest.fn().mockImplementation((roomId, callback) => {
    // Simulate real-time updates by calling the callback with mock messages
    callback([
      {
        id: '1',
        text: 'Hello, world!',
        createdAt: { toDate: () => new Date() },
        userName: 'Other User',
        roomId: 'test-room-id',
      },
    ]);

    // Return a mock unsubscribe function
    return jest.fn();
  }),
}));

// Mock the encryption module
jest.mock('@/lib/encryption', () => ({
  getRoomKey: jest.fn().mockReturnValue({}), // Return a mock key
}));

// Mock the useRef implementation
const mockScrollIntoView = jest.fn();
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useRef: jest.fn().mockImplementation(() => ({
      current: {
        scrollIntoView: mockScrollIntoView,
      },
    })),
  };
});

describe('Chat Room', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display messages from the room', async () => {
    render(
      <UserProvider>
        <RoomPage params={{ id: 'test-room-id' }} />
      </UserProvider>
    );

    // Check that subscribeToRoomMessages was called with the correct room ID
    expect(subscribeToRoomMessages).toHaveBeenCalledWith('test-room-id', expect.any(Function));

    // Check that the message is displayed
    expect(screen.getByText('Hello, world!')).toBeInTheDocument();

    // Check that the user name is displayed
    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  it('should send a message when the form is submitted', async () => {
    render(
      <UserProvider>
        <RoomPage params={{ id: 'test-room-id' }} />
      </UserProvider>
    );

    // Type a message
    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { 
      target: { value: 'Test message' } 
    });

    // Submit the form
    fireEvent.click(screen.getByText('Send'));

    // Check that sendMessage was called with the correct arguments
    expect(sendMessage).toHaveBeenCalledWith('test-room-id', 'Test message', 'Anonymous');

    // Check that the input was cleared
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your message/i)).toHaveValue('');
    });
  });

  it('should not send empty messages', () => {
    render(
      <UserProvider>
        <RoomPage params={{ id: 'test-room-id' }} />
      </UserProvider>
    );

    // Try to submit the form without typing a message
    fireEvent.click(screen.getByText('Send'));

    // Check that sendMessage was not called
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('should scroll to bottom when new messages arrive', () => {
    render(
      <UserProvider>
        <RoomPage params={{ id: 'test-room-id' }} />
      </UserProvider>
    );

    // Check that scrollIntoView was called
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should display a message when there are no messages', () => {
    // Override the subscribeToRoomMessages mock for this test
    (subscribeToRoomMessages as jest.Mock).mockImplementationOnce((roomId, callback) => {
      callback([]);
      return jest.fn();
    });

    render(
      <UserProvider>
        <RoomPage params={{ id: 'test-room-id' }} />
      </UserProvider>
    );

    // Check that the empty state message is displayed
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('should disable the input while sending a message', async () => {
    // Make sendMessage take some time to resolve
    (sendMessage as jest.Mock).mockImplementationOnce(() => {
      return new Promise(resolve => setTimeout(resolve, 100));
    });

    render(
      <UserProvider>
        <RoomPage params={{ id: 'test-room-id' }} />
      </UserProvider>
    );

    // Type a message
    fireEvent.change(screen.getByPlaceholderText(/type your message/i), { 
      target: { value: 'Test message' } 
    });

    // Submit the form
    fireEvent.click(screen.getByText('Send'));

    // Check that the input is disabled
    expect(screen.getByPlaceholderText(/type your message/i)).toBeDisabled();

    // Wait for sendMessage to resolve
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/type your message/i)).not.toBeDisabled();
    });
  });
});
