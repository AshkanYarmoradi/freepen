'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Omit all drag and animation-related properties from ButtonHTMLAttributes to avoid type conflicts with Framer Motion
interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 
  'onDrag' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' | 'onDragStart' |
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  // Add Framer Motion specific props if needed
}

export default function Button({
  children,
  className = '',
  variant = 'primary',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-md px-4 py-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 relative overflow-hidden';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-md',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500 shadow-sm',
    danger: 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 focus:ring-red-500 shadow-md',
  };

  const loadingStyles = isLoading ? 'opacity-70 cursor-not-allowed' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  // Button animation variants
  const buttonVariants = {
    initial: { 
      scale: 1 
    },
    hover: { 
      scale: 1.03,
      transition: { 
        type: 'spring' as const, 
        stiffness: 400, 
        damping: 10 
      } 
    },
    tap: { 
      scale: 0.97,
      transition: { 
        type: 'spring' as const, 
        stiffness: 400, 
        damping: 10 
      } 
    }
  };

  return (
    <motion.button
      className={`${baseStyles} ${variantStyles[variant]} ${loadingStyles} ${disabledStyles} ${className}`}
      disabled={isLoading || disabled}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !isLoading ? "hover" : "initial"}
      whileTap={!disabled && !isLoading ? "tap" : "initial"}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        <>
          <span className="relative z-10">{children}</span>
          <motion.div 
            className="absolute inset-0 bg-white opacity-0 z-0" 
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 0.1 }}
            transition={{ duration: 0.2 }}
          />
        </>
      )}
    </motion.button>
  );
}
