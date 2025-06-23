# Framer Motion Fix for Next.js 15.3.4

## Issue

When running `next build`, the following error occurred:

```
Failed to compile.

./node_modules/framer-motion/dist/es/index.mjs
Error: It's currently unsupported to use "export *" in a client boundary. Please use named exports instead.
    at Object.transformSource (C:\Users\ayarm\Sources\freepen\node_modules\next\dist\build\webpack\loaders\next-flight-loader\index.js:104:53)

Import trace for requested module:
./node_modules/framer-motion/dist/es/index.mjs
./src/app/layout.tsx
```

## Cause

The error occurs because:

1. In Next.js App Router, files in the `app` directory (like `layout.tsx`) are server components by default.
2. Server components cannot directly import client components that use "export *" syntax.
3. Framer Motion's package uses "export *" syntax in its index.mjs file.
4. The `AnimatePresence` component from Framer Motion was being imported directly in `layout.tsx`.

## Solution

The solution was to create a client component wrapper for the `AnimatePresence` component:

1. Created a new file `src/components/ui/AnimatePresenceWrapper.tsx` marked with `'use client'` directive.
2. This wrapper imports `AnimatePresence` from framer-motion and re-exports it as a client component.
3. Updated `layout.tsx` to import and use this wrapper instead of importing `AnimatePresence` directly.

This approach isolates the client-side code from the server component, avoiding the "export *" error.

## Files Changed

1. Created `src/components/ui/AnimatePresenceWrapper.tsx`
2. Modified `src/app/layout.tsx`

## Alternative Solutions

Other potential solutions that were not implemented:

1. Downgrading framer-motion to an earlier version that doesn't use "export *" syntax.
2. Using a different animation library that is compatible with Next.js server components.
3. Converting `layout.tsx` to a client component with `'use client'` directive (not recommended as it would make the entire layout client-side rendered).