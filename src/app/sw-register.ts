'use client';

// This file registers the service worker in the browser
// It should be imported in the app/layout.tsx file

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
    // Register the service worker after the page has loaded to avoid affecting the page load time
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });

    // Add event listeners for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed');
    });

    // Handle offline/online status changes
    window.addEventListener('online', () => {
      console.log('Application is online');
      document.dispatchEvent(new CustomEvent('app-online'));
    });

    window.addEventListener('offline', () => {
      console.log('Application is offline');
      document.dispatchEvent(new CustomEvent('app-offline'));
    });
  }
}

// Add a type declaration for the workbox property on the window object
declare global {
  interface Window {
    workbox: any;
  }
}