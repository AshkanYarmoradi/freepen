import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProvider } from '@/contexts/UserContext';
import Home from '@/app/page';
import CreateRoomPage from '@/app/create-room/page';
import { createRoom } from '@/lib/db';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
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
  
  it('should allow user to set name and navigate to create room page', () => {
    const { unmount } = render(
      <UserProvider>
        <Home />
      </UserProvider>
    );
    
    // Enter a name
    fireEvent.change(screen.getByLabelText(/your display name/i), { 
      target: { value: 'Test User' } 
    });
    
    // Click the create room button
    fireEvent.click(screen.getByText('Create a Room'));
    
    // Check that the router.push was called with the correct path
    expect(require('next/navigation').useRouter().push).toHaveBeenCalledWith('/create-room');
    
    unmount();
    
    // Render the create room page
    render(
      <UserProvider>
        <CreateRoomPage />
      </UserProvider>
    );
    
    // Fill in the room creation form
    fireEvent.change(screen.getByLabelText(/room name/i), { 
      target: { value: 'Test Room' } 
    });
    
    fireEvent.change(screen.getByLabelText(/room password/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Room'));
    
    // Check that createRoom was called with the correct arguments
    expect(createRoom).toHaveBeenCalledWith('Test Room', 'password123', 'Test User');
    
    // Check that the router.push was called with the correct path
    waitFor(() => {
      expect(require('next/navigation').useRouter().push).toHaveBeenCalledWith('/room/test-room-id');
    });
  });
  
  it('should show error message when room creation fails', async () => {
    // Mock createRoom to reject
    (createRoom as jest.Mock).mockRejectedValueOnce(new Error('Failed to create room'));
    
    render(
      <UserProvider>
        <CreateRoomPage />
      </UserProvider>
    );
    
    // Fill in the room creation form
    fireEvent.change(screen.getByLabelText(/room name/i), { 
      target: { value: 'Test Room' } 
    });
    
    fireEvent.change(screen.getByLabelText(/room password/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), { 
      target: { value: 'password123' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Room'));
    
    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to create room')).toBeInTheDocument();
    });
  });
  
  it('should validate form inputs', async () => {
    render(
      <UserProvider>
        <CreateRoomPage />
      </UserProvider>
    );
    
    // Submit the form without filling it
    fireEvent.click(screen.getByText('Create Room'));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText(/room name must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Fill in the form with mismatched passwords
    fireEvent.change(screen.getByLabelText(/room name/i), { 
      target: { value: 'Test Room' } 
    });
    
    fireEvent.change(screen.getByLabelText(/room password/i), { 
      target: { value: 'password123' } 
    });
    
    fireEvent.change(screen.getByLabelText(/confirm password/i), { 
      target: { value: 'password456' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Room'));
    
    // Check that password mismatch error is displayed
    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });
});