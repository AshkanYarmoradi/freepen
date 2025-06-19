import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';
import Home from '@/app/page';
import CreateRoomPage from '@/app/create-room/page';
import { createRoom } from '@/lib/db';

// Mock the next/navigation module
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the db module
jest.mock('@/lib/db', () => ({
  createRoom: jest.fn().mockResolvedValue('test-room-id'),
  hashPassword: jest.requireActual('@/lib/db').hashPassword,
}));

describe('Create Room Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow user to set name and navigate to create room page', async () => {
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

    // Click the create room button
    await act(async () => {
      fireEvent.click(screen.getByText('Create a Room'));
    });

    // Check that the router.push was called with the correct path
    expect(mockPush).toHaveBeenCalledWith('/create-room');

    // Unmount the component
    unmount();

    // Render the create room page
    await act(async () => {
      render(
        <UserProvider>
          <CreateRoomPage />
        </UserProvider>
      );
    });

    // Wait for the component to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    // Fill in the room creation form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room name/i), { 
        target: { value: 'Test Room' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room password/i), { 
        target: { value: 'password123' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/confirm password/i), { 
        target: { value: 'password123' } 
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Room'));
    });

    // Check that createRoom was called with the correct arguments
    expect(createRoom).toHaveBeenCalledWith('Test Room', 'password123', 'Test User');

    // Check that the router.push was called with the correct path
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/room/test-room-id');
    });
  });

  it('should show error message when room creation fails', async () => {
    // Mock createRoom to reject
    (createRoom as jest.Mock).mockRejectedValueOnce(new Error('Failed to create room'));

    await act(async () => {
      render(
        <UserProvider>
          <CreateRoomPage />
        </UserProvider>
      );
    });

    // Wait for the component to be fully rendered
    await waitFor(() => {
      expect(screen.getByLabelText(/room name/i)).toBeInTheDocument();
    });

    // Fill in the room creation form
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room name/i), { 
        target: { value: 'Test Room' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room password/i), { 
        target: { value: 'password123' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/confirm password/i), { 
        target: { value: 'password123' } 
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Room'));
    });

    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create room')).toBeInTheDocument();
    });
  });

  it('should validate form inputs', async () => {
    await act(async () => {
      render(
        <UserProvider>
          <CreateRoomPage />
        </UserProvider>
      );
    });

    // Wait for the component to be fully rendered
    await waitFor(() => {
      expect(screen.getByText('Create Room')).toBeInTheDocument();
    });

    // Submit the form without filling it
    await act(async () => {
      fireEvent.click(screen.getByText('Create Room'));
    });

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/room name must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });

    // Fill in the form with mismatched passwords
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room name/i), { 
        target: { value: 'Test Room' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/room password/i), { 
        target: { value: 'password123' } 
      });
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/confirm password/i), { 
        target: { value: 'password456' } 
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByText('Create Room'));
    });

    // Check that password mismatch error is displayed
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });
});
