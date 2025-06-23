'use client';

import React from 'react';
import { motion, easeInOut } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'text-indigo-600',
  text
}: LoadingSpinnerProps) {
  // Size mappings
  const sizeMap = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.2
      }
    }
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: { 
      y: [0, -10, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      aria-label="Loading"
      role="status"
    >
      <div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`rounded-full ${sizeMap[size]} ${color}`}
            variants={dotVariants}
            custom={i}
            style={{ 
              animationDelay: `${i * 0.2}s`,
              backgroundColor: 'currentColor'
            }}
          />
        ))}
      </div>

      {text && (
        <motion.p 
          className="mt-4 text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {text}
        </motion.p>
      )}
    </motion.div>
  );
}
