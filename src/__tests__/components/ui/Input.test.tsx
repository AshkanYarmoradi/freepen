import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '@/components/ui/Input';

describe('Input', () => {
  it('should render correctly', () => {
    render(<Input />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  
  it('should display label when provided', () => {
    render(<Input label="Test Label" />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });
  
  it('should not display label when not provided', () => {
    render(<Input />);
    
    expect(screen.queryByText(/label/i)).not.toBeInTheDocument();
  });
  
  it('should display error message when provided', () => {
    render(<Input error="Test error message" />);
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });
  
  it('should apply error styles when error is provided', () => {
    render(<Input error="Test error message" />);
    
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });
  
  it('should not apply error styles when error is not provided', () => {
    render(<Input />);
    
    expect(screen.getByRole('textbox')).toHaveClass('border-gray-300');
  });
  
  it('should call onChange handler when input value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
  
  it('should update input value when changed', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(input).toHaveValue('test value');
  });
  
  it('should apply additional className when provided', () => {
    render(<Input className="test-class" />);
    
    expect(screen.getByRole('textbox')).toHaveClass('test-class');
  });
  
  it('should forward ref to input element', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
  
  it('should apply all passed props to input element', () => {
    render(<Input placeholder="Test placeholder" maxLength={10} required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Test placeholder');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('required');
  });
});