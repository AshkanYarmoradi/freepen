import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '@/app/page';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the UserContext
jest.mock('@/contexts/UserContext', () => ({
  useUserContext: jest.fn(),
}));

describe('Home Page', () => {
  const mockPush = jest.fn();
  const mockSetUserName = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    
    (useUserContext as jest.Mock).mockReturnValue({
      userName: 'Initial Name',
      setUserName: mockSetUserName,
    });
  });
  
  it('renders the home page correctly', () => {
    render(<Home />);
    
    // Check if the title is rendered
    expect(screen.getByText('freepen Chat')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Freepen Chat')).toBeInTheDocument();
    
    // Check if the input field is rendered with the initial value
    const input = screen.getByLabelText('Your Display Name');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Initial Name');
    
    // Check if the buttons are rendered
    expect(screen.getByText('Create a Room')).toBeInTheDocument();
    expect(screen.getByText('Join a Room')).toBeInTheDocument();
  });
  
  it('updates the name input when typed', () => {
    render(<Home />);
    
    const input = screen.getByLabelText('Your Display Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    
    expect(input).toHaveValue('New Name');
  });
  
  it('navigates to create room page when Create a Room button is clicked', () => {
    render(<Home />);
    
    // Change the name
    const input = screen.getByLabelText('Your Display Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    
    // Click the Create a Room button
    const createButton = screen.getByText('Create a Room');
    fireEvent.click(createButton);
    
    // Check if the user name is set and navigation occurs
    expect(mockSetUserName).toHaveBeenCalledWith('New Name');
    expect(mockPush).toHaveBeenCalledWith('/create-room');
  });
  
  it('navigates to join room page when Join a Room button is clicked', () => {
    render(<Home />);
    
    // Change the name
    const input = screen.getByLabelText('Your Display Name');
    fireEvent.change(input, { target: { value: 'New Name' } });
    
    // Click the Join a Room button
    const joinButton = screen.getByText('Join a Room');
    fireEvent.click(joinButton);
    
    // Check if the user name is set and navigation occurs
    expect(mockSetUserName).toHaveBeenCalledWith('New Name');
    expect(mockPush).toHaveBeenCalledWith('/join-room');
  });
});