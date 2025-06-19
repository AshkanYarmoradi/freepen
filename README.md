# Pong - Secure Chat Room Application

Pong is a secure chat application built with Next.js and Firebase. It allows users to create private chat rooms protected by passwords and invite others to join these rooms for secure communication.

## Features

- **User Authentication**: Secure signup and login system
- **Create Chat Rooms**: Create private rooms with password protection
- **Join Chat Rooms**: Join existing rooms using room ID and password
- **Real-time Messaging**: Send and receive messages in real-time
- **Secure**: Password hashing, form validation, and authentication checks
- **Responsive Design**: Works on desktop and mobile devices

## Technologies Used

- **Next.js 15**: React framework for building the UI
- **Firebase Authentication**: For user authentication
- **Firestore Database**: For storing rooms and messages
- **TailwindCSS**: For styling
- **React Hook Form**: For form handling
- **Zod**: For form validation
- **TypeScript**: For type safety

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
4. Enable Authentication (Email/Password) and Firestore Database in your Firebase project
5. Update the `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```
6. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Application Structure

- `/src/app`: Next.js app router pages
- `/src/components`: Reusable UI components
- `/src/contexts`: React contexts (AuthContext)
- `/src/lib`: Utility functions and Firebase setup

## Security Features

- Password hashing for room passwords
- Form validation with Zod
- Authentication checks on all pages
- Secure Firebase rules (to be configured in Firebase console)

## Deployment

The application can be deployed to Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel
4. Deploy

## Firebase Security Rules

For production, configure these Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and create rooms
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }

    // Allow room members to read and create messages
    match /messages/{messageId} {
      allow read: if request.auth != null && 
                   exists(/databases/$(database)/documents/roomMembers/$(resource.data.roomId + '_' + request.auth.uid));
      allow create: if request.auth != null && 
                     exists(/databases/$(database)/documents/roomMembers/$(request.resource.data.roomId + '_' + request.auth.uid));
    }

    // Allow users to read and create room memberships
    match /roomMembers/{membershipId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                     membershipId.matches(request.resource.data.roomId + '_' + request.auth.uid);
    }
  }
}
```
