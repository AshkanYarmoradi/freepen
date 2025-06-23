'use client';

import React, { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Omit all drag and animation-related properties from InputHTMLAttributes to avoid type conflicts with Framer Motion
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 
  'onDrag' | 'onDragEnd' | 'onDragEnter' | 'onDragExit' | 'onDragLeave' | 'onDragOver' | 'onDragStart' |
  'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    // Generate a unique ID if one isn't provided
    const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substring(2, 9)}`;
    const [isFocused, setIsFocused] = useState(false);

    return (
      <motion.div 
        className="w-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
      >
        {label && (
          <motion.label 
            htmlFor={inputId} 
            className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
              isFocused ? 'text-blue-600' : 'text-gray-700'
            }`}
            animate={{ 
              scale: isFocused ? 1.02 : 1,
              x: isFocused ? 2 : 0
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.label>
        )}
        <motion.div
          className="relative"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
        >
          <motion.input
            id={inputId}
            ref={ref}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 text-gray-600 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
              error ? 'border-red-500' : isFocused ? 'border-blue-400' : 'border-gray-300'
            } ${className}`}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          <AnimatePresence>
            {isFocused && (
              <motion.div 
                className="absolute inset-0 rounded-md pointer-events-none"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{ 
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.2)',
                  zIndex: -1
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {error && (
            <motion.p 
              className="mt-1 text-sm text-red-600"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
