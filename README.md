# freepen - Secure Chat Room Application

freepen is a secure chat application built with Next.js and Firebase. It allows users to create private chat rooms protected by passwords and invite others to join these rooms for secure communication. The application prioritizes security and privacy while providing a seamless real-time messaging experience.

## Features

- **User Authentication**: Secure signup and login system with Firebase Authentication
- **Create Chat Rooms**: Create private rooms with password protection and customizable settings
- **Join Chat Rooms**: Join existing rooms using room ID and password verification
- **Real-time Messaging**: Send and receive messages in real-time with instant updates
- **Message History**: Access complete message history when joining a room
- **End-to-End Encryption**: Messages are encrypted on the client side before being sent to the server
- **Secure Communication**: End-to-end message validation and sanitization
- **Rate Limiting**: Protection against abuse with configurable rate limits
- **Security Logging**: Comprehensive logging of security events for monitoring
- **Responsive Design**: Fully responsive UI that works on desktop, tablet, and mobile devices
- **Accessibility**: Designed with accessibility in mind for all users

## Technologies Used

- **Next.js 15**: React framework with App Router for building the UI
- **React 19**: Latest version of React with improved performance
- **Firebase Authentication**: For secure user authentication
- **Firestore Database**: For storing rooms, messages, and user data
- **TailwindCSS 4**: For responsive and customizable styling
- **React Hook Form**: For efficient form handling and validation
- **Zod**: For robust schema validation and type safety
- **TypeScript**: For static type checking and improved developer experience
- **Iron Session**: For secure, encrypted session management
- **DOMPurify**: For sanitizing user input to prevent XSS attacks
- **Jest & Testing Library**: For comprehensive testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/freepen.git
   cd freepen
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Create a new project
   - Enable Authentication (Email/Password)
   - Create a Firestore Database in production mode
   - Generate a new private key for Firebase Admin SDK:
     - Go to Project settings > Service accounts
     - Click "Generate new private key"
     - Save the JSON file securely
     - You'll need the `project_id`, `client_email`, and `private_key` values for your .env.local file

4. Update the `.env.local` file with your Firebase configuration:
   ```
   # Firebase Client SDK
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

   # Session Configuration
   SESSION_SECRET=your-secure-random-string

   # Firebase Admin SDK configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key content here...\n-----END PRIVATE KEY-----\n"

   # Rate Limiting (optional, defaults provided)
   RATE_LIMIT_ROOM_CREATE=5
   RATE_LIMIT_ROOM_JOIN=10
   RATE_LIMIT_MESSAGE_SEND=20
   ```

5. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Running Tests

The project includes comprehensive tests to ensure functionality and security:

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch
```

## Application Architecture

### Directory Structure

- `/src/app`: Next.js app router pages and API routes
  - `/api`: Backend API endpoints
    - `/auth`: Authentication endpoints
    - `/messages`: Message handling endpoints
    - `/rooms`: Room management endpoints
  - `/room`: Room UI and functionality
  - `/login`, `/signup`: Authentication UI
- `/src/components`: Reusable UI components
  - `/auth`: Authentication-related components
  - `/chat`: Chat-related components
  - `/ui`: Generic UI components
- `/src/contexts`: React contexts for state management
  - `AuthContext`: User authentication state
  - `ChatContext`: Chat and messaging state
- `/src/lib`: Utility functions and service integrations
  - `firebase.ts`: Firebase client configuration
  - `firebase-admin.ts`: Firebase admin SDK setup
  - `db.ts`: Database utility functions
  - `session.ts`: Session management
  - `rate-limit.ts`: Rate limiting implementation
  - `security-logger.ts`: Security event logging

### Data Flow

1. User authenticates via Firebase Authentication
2. Session is established using Iron Session
3. User creates or joins a room with password protection
4. Room authentication is verified for each request
5. Messages are validated, sanitized, and stored in Firestore
6. Real-time updates are delivered to all room participants

## API Documentation

### Authentication API

- **POST /api/auth/session**
  - Create a new user session
  - Body: `{ email: string, password: string }`
  - Response: `{ success: boolean, user?: User }`

- **GET /api/auth/session**
  - Get current user session
  - Response: `{ user?: User }`

- **DELETE /api/auth/session**
  - End current user session
  - Response: `{ success: boolean }`

- **POST /api/auth/room**
  - Authenticate to a room with password
  - Body: `{ roomId: string, password: string }`
  - Response: `{ success: boolean, error?: string }`

- **GET /api/auth/room**
  - Check if authenticated to a room
  - Query: `?roomId=string`
  - Response: `{ authenticated: boolean }`

### Rooms API

- **POST /api/rooms/create**
  - Create a new chat room
  - Body: `{ name: string, password: string }`
  - Response: `{ success: boolean, roomId?: string, error?: string }`

- **POST /api/rooms/join**
  - Join an existing chat room
  - Body: `{ roomId: string, password: string }`
  - Response: `{ success: boolean, error?: string }`

### Messages API

- **GET /api/messages/[roomId]**
  - Get messages for a room
  - Params: `roomId`
  - Response: `{ messages: Message[] }`

- **GET /api/messages/[roomId]/stream**
  - Stream real-time messages for a room
  - Params: `roomId`
  - Response: Server-sent events with message data

- **POST /api/messages/send**
  - Send a message to a room
  - Body: `{ roomId: string, content: string }`
  - Response: `{ success: boolean, messageId?: string, error?: string }`

## Security Features

For detailed security information, see [SECURITY.md](SECURITY.md). Key features include:

- **Password Hashing**: Secure hashing for room passwords
- **Input Validation**: Comprehensive validation with Zod
- **Content Sanitization**: DOMPurify for XSS prevention
- **Rate Limiting**: Protection against brute force and DoS attacks
- **Session Security**: Encrypted cookies with Iron Session
- **Content Security Policy**: Strict CSP headers
- **CORS Configuration**: Properly configured CORS policies
- **Security Logging**: Detailed logging of security events
- **Authentication Checks**: Thorough authentication on all protected routes
- **Firestore Security Rules**: Granular access control

## Deployment

The application can be deployed to Vercel:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure environment variables in Vercel
   - Add all Firebase configuration variables
   - Add SESSION_SECRET and other environment variables
4. Deploy the application
5. Configure custom domain (optional)

For other deployment options:

- **Docker**: Dockerfile is provided for containerized deployment
- **Firebase Hosting**: Can be deployed alongside Firebase services
- **Self-hosted**: Can be built and served as a static site with API routes

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

    // Restrict access to security logs
    match /securityLogs/{logId} {
      allow read, write: if false; // Only accessible via Firebase Admin SDK
    }
  }
}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Run tests to ensure they pass (`npm test`)
5. Commit your changes (`git commit -m 'Add some feature'`)
6. Push to the branch (`git push origin feature/your-feature-name`)
7. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Troubleshooting

### Common Installation Issues

1. **Node.js Version Compatibility**
   - **Issue**: Build errors or unexpected behavior
   - **Solution**: Ensure you're using Node.js v18 or higher. Use `nvm` to manage Node.js versions:
     ```bash
     nvm install 18
     nvm use 18
     ```

2. **Firebase Configuration**
   - **Issue**: "Firebase app already exists" error
   - **Solution**: This typically happens in development with hot reloading. Refresh the page to resolve.

3. **Environment Variables**
   - **Issue**: "Missing environment variables" error
   - **Solution**: Double-check your `.env.local` file contains all required variables listed in the setup section.
   - **Note**: Remember that environment variables starting with `NEXT_PUBLIC_` are exposed to the browser.

4. **Firestore Permissions**
   - **Issue**: "Permission denied" errors when accessing Firestore
   - **Solution**: Verify your Firestore security rules are properly configured and that your Firebase Admin SDK credentials are correct.

5. **Build Errors**
   - **Issue**: TypeScript errors during build
   - **Solution**: Run `npm run type-check` to identify and fix type issues before building.

### Deployment Troubleshooting

1. **Vercel Deployment**
   - **Issue**: Environment variables not working
   - **Solution**: Ensure all environment variables are properly set in the Vercel project settings.

2. **Firebase Admin SDK**
   - **Issue**: "Error: Failed to initialize Firebase Admin SDK"
   - **Solution**: Verify that your `FIREBASE_PRIVATE_KEY` is properly formatted with newlines (`\n`).

## Performance Considerations

### Client-Side Optimization

1. **Bundle Size Management**
   - The application uses dynamic imports to reduce initial load time
   - Run `npm run analyze` to visualize bundle sizes and identify optimization opportunities

2. **Image Optimization**
   - Use the Next.js Image component for automatic image optimization
   - Consider using WebP format for better compression

3. **State Management**
   - Use React Context API for global state that changes infrequently
   - Consider using SWR or React Query for data fetching and caching

### Server-Side Optimization

1. **API Route Caching**
   - Implement appropriate caching headers for API routes
   - Use Edge Functions for latency-sensitive operations

2. **Database Queries**
   - Limit query results to reduce data transfer
   - Use composite indexes for complex queries
   - Implement pagination for large data sets

3. **Firestore Best Practices**
   - Use batch operations for multiple writes
   - Implement denormalization for frequently accessed data
   - Set up appropriate TTL (Time To Live) for temporary data

## Browser Compatibility

The application is tested and supported on the following browsers:

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Fully supported |
| Firefox | 88+ | Fully supported |
| Safari | 14+ | Fully supported |
| Edge | 90+ | Fully supported |
| Opera | 76+ | Fully supported |
| iOS Safari | 14+ | Minor styling differences |
| Android Chrome | 90+ | Minor styling differences |
| Samsung Internet | 14+ | Minor styling differences |

### Accessibility Considerations

- The application is designed to meet WCAG 2.1 AA standards
- Screen reader compatible with ARIA attributes
- Keyboard navigation support
- Color contrast ratios meet accessibility standards
- Focus management for modal dialogs and dynamic content

## Project Roadmap

### Short-term Goals (Next 3 Months)

- [x] Implement end-to-end encryption for messages ✓
- [ ] Add file sharing capabilities
- [ ] Enhance mobile experience with PWA features
- [ ] Implement user profiles with avatars
- [ ] Add typing indicators and read receipts

### Medium-term Goals (3-6 Months)

- [ ] Implement voice and video chat
- [ ] Add support for message reactions and threads
- [ ] Create a public room directory with discovery features
- [ ] Implement advanced search functionality
- [ ] Add integration with popular services (Google Drive, Dropbox, etc.)

### Long-term Goals (6+ Months)

- [ ] Develop a native mobile application
- [ ] Implement AI-powered features (smart replies, content moderation)
- [ ] Add support for plugins and extensions
- [ ] Create an API for third-party integrations
- [ ] Implement advanced analytics and insights

## Frequently Asked Questions

### General Questions

**Q: Is freepen free to use?**  
A: Yes, freepen is open-source and free to use under the MIT license.

**Q: Can I self-host freepen?**  
A: Yes, you can deploy freepen to your own infrastructure. Follow the deployment instructions in this README.

**Q: Is my data encrypted?**  
A: Yes! All data is transmitted over HTTPS, and we've implemented end-to-end encryption for messages using the Web Crypto API with AES-GCM 256-bit encryption.

### Technical Questions

**Q: Can I contribute to freepen?**  
A: Yes! See the Contributing section for details on how to contribute.

**Q: How do I report a bug?**  
A: Open an issue on GitHub with detailed steps to reproduce the bug.

**Q: Can I use freepen in my commercial project?**  
A: Yes, the MIT license allows commercial use.

**Q: How do I customize the UI?**  
A: The UI is built with TailwindCSS, which makes customization straightforward. Modify the tailwind.config.js file to change the theme.

**Q: Does freepen support multiple languages?**  
A: Internationalization is planned but not yet implemented. Contributions for this feature are welcome!

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework
- [Firebase](https://firebase.google.com/) - Backend services
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- All contributors who have helped improve this project
