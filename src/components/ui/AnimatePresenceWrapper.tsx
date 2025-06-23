'use client';

import { AnimatePresence } from 'framer-motion';
import React from 'react';

interface AnimatePresenceWrapperProps {
  children: React.ReactNode;
  mode?: "sync" | "wait" | "popLayout";
}

export default function AnimatePresenceWrapper({ 
  children,
  mode = "wait"
}: AnimatePresenceWrapperProps) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
}