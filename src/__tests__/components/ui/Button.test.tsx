import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/ui/Button';

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Test Button</Button>);
    
    expect(screen.getByRole('button')).toHaveTextContent('Test Button');
  });
  
  it('should apply primary variant styles by default', () => {
    render(<Button>Test Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');
  });
  
  it('should apply secondary variant styles when specified', () => {
    render(<Button variant="secondary">Test Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
    expect(button).toHaveClass('text-gray-800');
  });
  
  it('should apply danger variant styles when specified', () => {
    render(<Button variant="danger">Test Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
    expect(button).toHaveClass('text-white');
  });
  
  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Test Button</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should show loading state when isLoading prop is true', () => {
    render(<Button isLoading>Test Button</Button>);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Test Button')).not.toBeInTheDocument();
  });
  
  it('should be disabled when isLoading prop is true', () => {
    render(<Button isLoading>Test Button</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Test Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('should not call onClick handler when disabled', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Test Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('should not call onClick handler when loading', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} isLoading>Test Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  it('should apply additional className when provided', () => {
    render(<Button className="test-class">Test Button</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('test-class');
  });
});