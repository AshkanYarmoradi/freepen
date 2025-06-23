'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserContext } from '@/contexts/UserContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { userName, setUserName } = useUserContext();
  const router = useRouter();
  const [nameInput, setNameInput] = useState(userName);
  const controls = useAnimation();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Start animations when component mounts
    const sequence = async () => {
      await controls.start("visible");
      setIsLoaded(true);
    };
    sequence();
  }, [controls]);

  const handleCreateRoom = () => {
    setUserName(nameInput);
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    setUserName(nameInput);
    router.push('/join-room');
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring" as const, 
        stiffness: 300, 
        damping: 24 
      }
    }
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 1.5 }
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"
      initial="hidden"
      animate="visible"
      variants={backgroundVariants}
    >
      <motion.header 
        className="bg-white shadow-md"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <motion.h1 
            className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text"
            variants={itemVariants}
          >
            Freepen Chat
          </motion.h1>
          <motion.div variants={itemVariants}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 17 }}
            >
              <Link 
                href="https://github.com/AshkanYarmoradi/freepen" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-500 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                GitHub
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.header>

      <motion.main 
        className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        <motion.div 
          className="px-4 py-6 sm:px-0"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-white overflow-hidden shadow-lg rounded-lg border border-gray-100"
            variants={itemVariants}
            whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="px-4 py-8 sm:p-8"
              variants={itemVariants}
            >
              <motion.div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: isLoaded ? 1 : 0 }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" as const }}
              />

              <motion.h2 
                className="text-3xl font-bold text-gray-800 mb-8 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text"
                variants={itemVariants}
                animate={{ 
                  scale: [1, 1.02, 1],
                  transition: { 
                    repeat: Infinity, 
                    repeatType: "reverse" as const, 
                    duration: 2 
                  }
                }}
              >
                Welcome to Freepen Chat
              </motion.h2>

              <motion.div 
                className="max-w-md mx-auto"
                variants={itemVariants}
              >
                <motion.div 
                  className="mb-8"
                  variants={itemVariants}
                >
                  <Input
                    label="Your Display Name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                  />
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
                  variants={itemVariants}
                >
                  <Button onClick={handleCreateRoom} className="w-full sm:w-auto">
                    Create a Room
                  </Button>
                  <Button variant="secondary" onClick={handleJoinRoom} className="w-full sm:w-auto">
                    Join a Room
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.main>

      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <AnimatePresence>
          {isLoaded && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={`bg-element-${i}`}
                  className="absolute rounded-full bg-gradient-to-r from-blue-400/10 to-indigo-400/10"
                  initial={{ 
                    x: `${Math.random() * 100}%`, 
                    y: `${Math.random() * 100}%`,
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{ 
                    scale: Math.random() * 3 + 1,
                    opacity: Math.random() * 0.3 + 0.1,
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    transition: { 
                      duration: Math.random() * 10 + 10,
                      repeat: Infinity,
                      repeatType: "reverse" as const
                    }
                  }}
                  style={{
                    width: `${Math.random() * 300 + 100}px`,
                    height: `${Math.random() * 300 + 100}px`,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
