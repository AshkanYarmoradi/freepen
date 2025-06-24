// This script compiles the service worker TypeScript file to JavaScript
// and places it in the public directory

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Paths
const srcPath = path.join(__dirname, '..', 'src', 'app', 'service-worker.ts');
const destPath = path.join(__dirname, '..', 'public', 'service-worker.js');

// Ensure the public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

try {
  // Use TypeScript compiler to compile the service worker
  console.log('Compiling service worker...');
  const result = spawnSync('npx', [
    'tsc',
    srcPath,
    '--outDir', publicDir,
    '--target', 'ES2020',
    '--module', 'ESNext',
    '--moduleResolution', 'node',
    '--skipLibCheck',
    '--lib', 'es2020,webworker'
  ], { encoding: 'utf8', stdio: 'inherit' });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`TypeScript compilation failed with exit code ${result.status}`);
  }

  // Read the compiled file
  const compiledPath = path.join(publicDir, 'service-worker.js');
  let serviceWorkerCode = fs.readFileSync(compiledPath, 'utf8');

  // Add a timestamp comment for cache busting
  serviceWorkerCode = `// Generated on: ${new Date().toISOString()}\n${serviceWorkerCode}`;

  // Write the final service worker file
  fs.writeFileSync(destPath, serviceWorkerCode);

  // Clean up the temporary compiled file if it's different from the destination
  if (compiledPath !== destPath && fs.existsSync(compiledPath)) {
    fs.unlinkSync(compiledPath);
  }

  console.log('Service worker generated successfully at:', destPath);
} catch (error) {
  console.error('Error generating service worker:', error);
  process.exit(1);
}
