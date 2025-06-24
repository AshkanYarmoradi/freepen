'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './sw-register';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // This component doesn't render anything
  return null;
}