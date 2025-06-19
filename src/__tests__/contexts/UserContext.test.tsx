import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProvider, useUserContext } from '@/contexts/UserContext';

// Test component that uses the UserContext
const TestComponent = () => {
  const { userName, setUserName } = useUserContext();
  
  return (
    <div>
      <div data-testid="user-name">{userName}</div>
      <button onClick={() => setUserName('Test User')}>Set Name</button>
    </div>
  );
};

describe('UserContext', () => {
  it('should provide default userName value', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );
    
    expect(screen.getByTestId('user-name')).toHaveTextContent('Anonymous');
  });
  
  it('should update userName when setUserName is called', () => {
    render(
      <UserProvider>
        <TestComponent />
      </UserProvider>
    );
    
    // Check initial value
    expect(screen.getByTestId('user-name')).toHaveTextContent('Anonymous');
    
    // Click the button to update the name
    fireEvent.click(screen.getByText('Set Name'));
    
    // Check that the name was updated
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
  });
  
  it('should throw an error when used outside of UserProvider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();
    
    // Expect the render to throw an error
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUserContext must be used within a UserProvider');
    
    // Restore console.error
    console.error = originalError;
  });
});