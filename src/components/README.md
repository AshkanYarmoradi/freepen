# Components Directory

This directory contains reusable UI components used throughout the freepen application. The components are organized into subdirectories based on their purpose and functionality.

## Directory Structure

- `/ui`: Basic UI components that form the building blocks of the application interface
  - `Avatar.tsx`: SVG avatar component that displays user avatars generated with @multiavatar/multiavatar
  - `Button.tsx`: Customizable button component with various styles and states
  - `Input.tsx`: Form input component with validation integration

## Component Guidelines

### Component Design Principles

1. **Reusability**: Components should be designed to be reused across multiple parts of the application
2. **Composability**: Components should be composable with other components
3. **Accessibility**: All components must be accessible and follow WCAG 2.1 AA standards
4. **Responsiveness**: Components should work well on all screen sizes
5. **Performance**: Components should be optimized for performance

### Creating New Components

When creating new components:

1. Place them in the appropriate subdirectory based on their purpose
2. Use TypeScript for type safety
3. Include PropTypes or TypeScript interface for props
4. Add JSDoc comments for better documentation
5. Follow the naming convention: PascalCase for component files and functions

### Component Structure

```tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Button component with various styles and states
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 */
export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ...props
}: ButtonProps) {
  // Component implementation
}
```

### Using Components

Import components using absolute imports:

```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useUserContext } from '@/contexts/UserContext';

function UserProfile() {
  const { userName, getUserAvatar } = useUserContext();
  const roomId = 'example-room';

  return (
    <div className="flex items-center">
      <Avatar 
        svgCode={getUserAvatar(roomId)} 
        size={40} 
        className="mr-2"
      />
      <div>
        <h2>{userName}</h2>
        <Input 
          label="Email" 
          type="email" 
          name="email" 
          required 
        />
        <Button type="submit">
          Update Profile
        </Button>
      </div>
    </div>
  );
}
```

## Testing Components

Components should be tested using Jest and React Testing Library. Test files should be placed in the `__tests__` directory at the project root.

Example test:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Styling Components

Components use TailwindCSS for styling. Use the `cn` utility function from `@/lib/utils` to conditionally apply classes:

```tsx
import { cn } from '@/lib/utils';

function Button({ className, variant }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded font-medium',
        variant === 'primary' && 'bg-blue-500 text-white',
        variant === 'secondary' && 'bg-gray-200 text-gray-800',
        className
      )}
    >
      {children}
    </button>
  );
}
```

## Future Plans

- Add more specialized components for chat functionality
- Create a component storybook using Storybook.js
- Implement theme switching capability
- Add animation components
