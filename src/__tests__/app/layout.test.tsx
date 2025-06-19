import React from 'react';
import { render } from '@testing-library/react';
import RootLayout from '@/app/layout';

// Mock the UserProvider component
jest.mock('@/contexts/UserContext', () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="user-provider">{children}</div>
  ),
}));

// Mock the next/font/google module
jest.mock('next/font/google', () => ({
  Geist: () => ({
    variable: 'mock-geist-variable',
  }),
  Geist_Mono: () => ({
    variable: 'mock-geist-mono-variable',
  }),
}));

describe('RootLayout', () => {
  it('renders the layout with UserProvider', () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="child-component">Test Child</div>
      </RootLayout>
    );
    
    // Check if UserProvider is rendered
    const userProvider = getByTestId('user-provider');
    expect(userProvider).toBeInTheDocument();
    
    // Check if the child component is rendered inside UserProvider
    const childComponent = getByTestId('child-component');
    expect(childComponent).toBeInTheDocument();
    expect(userProvider).toContainElement(childComponent);
  });
  
  it('sets the correct language attribute', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    
    // Check if the html element has the correct lang attribute
    const htmlElement = container.querySelector('html');
    expect(htmlElement).toHaveAttribute('lang', 'en');
  });
  
  it('applies font variables to the body', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );
    
    // Check if the body element has the font variables
    const bodyElement = container.querySelector('body');
    expect(bodyElement).toHaveClass('mock-geist-variable');
    expect(bodyElement).toHaveClass('mock-geist-mono-variable');
    expect(bodyElement).toHaveClass('antialiased');
  });
});