import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';
import Home from '@/app/page';
import JoinRoomPage from '@/app/join-room/page';
import { joinRoom } from '@/lib/db';

// Mock the next/navigation module
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the db module
jest.mock('@/lib/db', () => ({
  joinRoom: jest.fn().mockResolvedValue('test-room-id'),
  hashPassword: jest.requireActual('@/lib/db').hashPassword,
}));

describe('Join Room Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow user to set name and navigate to join room page', async () => {
    let unmount: () => void;

    // Render the Home component
    await act(async () => {
      const result = render(
        <UserProvider>
          <Home />
        </UserProvider>
      );
      unmount = result.unmount;
    });

    // Wait for the component to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/your display name/i)).toBeInTheDocument();
    });

    // Enter a name
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/your display name/i), { 
        target: { value: 'Test User' } 
      });
    });

    // Click the join room button
    await act(async () => {
      fireEvent.click(screen.getByText('Join a Room'));
    });

    // Check that the router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/join-room');

    // Unmount the component
    unmount();

    // Render the join room page
    await act(async () => {
      render(
        <UserProvider>
          <JoinRoomPage />
        </UserProvider>
      );
    });

    // Fill in the join room form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room id/i), { 
        target: { value: 'test-room-id' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room password/i), { 
        target: { value: 'password123' } 
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Join Room'));
    });

    // Check that joinRoom was called with the correct arguments
    expect(joinRoom).toHaveBeenCalledWith('test-room-id', 'password123', 'Test User');

    // Check that the router.push was called with the correct path
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/room/test-room-id');
    });
  });

  it('should show error message when room joining fails', async () => {
    // Mock joinRoom to reject
    (joinRoom as jest.Mock).mockRejectedValueOnce(new Error('Room not found'));

    await act(async () => {
      render(
        <UserProvider>
          <JoinRoomPage />
        </UserProvider>
      );
    });

    // Fill in the join room form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room id/i), { 
        target: { value: 'test-room-id' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room password/i), { 
        target: { value: 'password123' } 
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Join Room'));
    });

    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Room not found')).toBeInTheDocument();
    });
  });

  it('should validate form inputs', async () => {
    await act(async () => {
      render(
        <UserProvider>
          <JoinRoomPage />
        </UserProvider>
      );
    });

    // Submit the form without filling it
    await act(async () => {
      fireEvent.click(screen.getByText('Join Room'));
    });

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/room id is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });
});
