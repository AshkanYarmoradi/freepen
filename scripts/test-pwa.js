// This script can be used to test the PWA functionality
// It checks if the necessary files exist and have the correct content

const fs = require('fs');
const path = require('path');

// Paths
const publicDir = path.join(__dirname, '..', 'public');
const manifestPath = path.join(publicDir, 'manifest.json');
const serviceWorkerPath = path.join(publicDir, 'service-worker.js');

// Check if manifest.json exists
console.log('Checking manifest.json...');
if (fs.existsSync(manifestPath)) {
  console.log('✅ manifest.json exists');
  
  // Check manifest.json content
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('Manifest properties:');
    console.log('- name:', manifest.name);
    console.log('- short_name:', manifest.short_name);
    console.log('- start_url:', manifest.start_url);
    console.log('- display:', manifest.display);
    console.log('- icons count:', manifest.icons?.length || 0);
    
    if (!manifest.name || !manifest.short_name || !manifest.start_url || !manifest.display || !manifest.icons) {
      console.warn('⚠️ Manifest is missing some required properties');
    } else {
      console.log('✅ Manifest has all required properties');
    }
  } catch (error) {
    console.error('❌ Error parsing manifest.json:', error.message);
  }
} else {
  console.error('❌ manifest.json does not exist');
}

// Check if service-worker.js exists
console.log('\nChecking service-worker.js...');
if (fs.existsSync(serviceWorkerPath)) {
  console.log('✅ service-worker.js exists');
  
  // Check service worker content
  const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8');
  
  if (serviceWorkerContent.includes('self.addEventListener(\'install\'')) {
    console.log('✅ Service worker has install event handler');
  } else {
    console.warn('⚠️ Service worker is missing install event handler');
  }
  
  if (serviceWorkerContent.includes('self.addEventListener(\'fetch\'')) {
    console.log('✅ Service worker has fetch event handler');
  } else {
    console.warn('⚠️ Service worker is missing fetch event handler');
  }
  
  if (serviceWorkerContent.includes('self.addEventListener(\'activate\'')) {
    console.log('✅ Service worker has activate event handler');
  } else {
    console.warn('⚠️ Service worker is missing activate event handler');
  }
} else {
  console.error('❌ service-worker.js does not exist');
  console.log('Run `npm run generate-sw` to generate the service worker');
}

// Check for offline page
const offlinePath = path.join(__dirname, '..', 'src', 'app', 'offline', 'page.tsx');
console.log('\nChecking offline page...');
if (fs.existsSync(offlinePath)) {
  console.log('✅ Offline page exists');
} else {
  console.warn('⚠️ Offline page does not exist');
}

console.log('\nPWA test completed. To fully test the PWA functionality:');
console.log('1. Run `npm run build` to generate the service worker and build the app');
console.log('2. Run `npm start` to start the app in production mode');
console.log('3. Open the app in Chrome and use Lighthouse to audit the PWA functionality');
console.log('4. Check that the app works offline by using the Application tab in Chrome DevTools');