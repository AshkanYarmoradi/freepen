import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  getApps: jest.fn(),
  initializeApp: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
}));

describe('Firebase Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project-id',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-sender-id',
      NEXT_PUBLIC_FIREBASE_APP_ID: 'test-app-id',
      NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'test-measurement-id',
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should initialize Firebase app with correct config', () => {
    // Mock getApps to return empty array to force initialization
    (getApps as jest.Mock).mockReturnValue([]);

    // Re-import the module to trigger initialization
    jest.isolateModules(async () => {
      await import('@/lib/firebase');
    });

    // Check if initializeApp was called with correct config
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id',
      measurementId: 'test-measurement-id',
    });
  });

  it('should reuse existing Firebase app if available', () => {
    // Mock getApps to return an existing app
    const mockApp = { name: 'test-app' };
    (getApps as jest.Mock).mockReturnValue([mockApp]);

    // Re-import the module to trigger initialization
    jest.isolateModules(async () => {
      await import('@/lib/firebase');
    });

    // Check that initializeApp was not called
    expect(initializeApp).not.toHaveBeenCalled();

    // Check that getFirestore was called with the existing app
    expect(getFirestore).toHaveBeenCalledWith(mockApp);
  });

  it('should export Firestore database instance', async () => {
    // Mock getFirestore to return a mock db
    const mockDb = { collection: jest.fn() };
    (getFirestore as jest.Mock).mockReturnValue(mockDb);

    // Re-import the module to get the exported db
    await jest.isolateModules(async () => {
      const firebase = await import('@/lib/firebase');
      expect(firebase.db).toBe(mockDb);
    });
  });
});
