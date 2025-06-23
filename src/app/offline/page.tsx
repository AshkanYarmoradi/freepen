'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          You&apos;re Offline
        </h1>

        <motion.div 
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ 
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 1
          }}
          className="mb-6"
        >
          <svg 
            className="w-24 h-24 mx-auto text-indigo-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 010-7.07m-3.535 3.536a1 1 0 010-1.414" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9.172 16.172a4 4 0 015.656 0M12 13a1 1 0 110-2 1 1 0 010 2z" 
            />
          </svg>
        </motion.div>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          It looks like you&apos;re currently offline. Some features may be unavailable until you reconnect to the internet.
        </p>

        <div className="space-y-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" className="block w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
              Try Again
            </Link>
          </motion.div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            You can still access previously loaded chat rooms and messages while offline.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
