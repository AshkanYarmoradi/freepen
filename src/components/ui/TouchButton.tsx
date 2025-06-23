'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export default function TouchButton({
  children,
  onClick,
  className = '',
  disabled = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  loading = false,
}: TouchButtonProps) {
  // Variant styles
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    outline: 'bg-transparent border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-2.5 px-5',
  };

  // Base styles
  const baseStyles = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  // Width styles
  const widthStyles = fullWidth ? 'w-full' : '';

  // Disabled styles
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${disabledStyles} ${className} flex items-center justify-center gap-2`}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon && iconPosition === 'left' ? (
        <span className="inline-flex">{icon}</span>
      ) : null}

      <span>{children}</span>

      {!loading && icon && iconPosition === 'right' && (
        <span className="inline-flex">{icon}</span>
      )}
    </motion.button>
  );
}
