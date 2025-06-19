import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Mock Firebase Admin modules
jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn(),
  initializeApp: jest.fn(),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

describe('Firebase Admin', () => {
  const originalEnv = process.env;
  const mockSettings = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env = {
      ...originalEnv,
      FIREBASE_PROJECT_ID: 'test-project-id',
      FIREBASE_CLIENT_EMAIL: 'test-client-email',
      FIREBASE_PRIVATE_KEY: 'test-private-key',
    };

    // Mock Firestore settings
    (getFirestore as jest.Mock).mockReturnValue({
      settings: mockSettings,
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should initialize Firebase Admin app with correct config', () => {
    // Mock getApps to return empty array to force initialization
    (getApps as jest.Mock).mockReturnValue([]);

    // Mock cert function
    (cert as jest.Mock).mockReturnValue('test-credential');

    // Re-import the module to trigger initialization
    jest.isolateModules(async () => {
      await import('@/lib/firebase-admin');
    });

    // Check if cert was called with correct params
    expect(cert).toHaveBeenCalledWith({
      projectId: 'test-project-id',
      clientEmail: 'test-client-email',
      privateKey: 'test-private-key',
    });

    // Check if initializeApp was called with correct config
    expect(initializeApp).toHaveBeenCalledWith({
      credential: 'test-credential',
      databaseURL: 'https://test-project-id.firebaseio.com',
    });
  });

  it('should handle newline characters in private key', () => {
    // Mock getApps to return empty array to force initialization
    (getApps as jest.Mock).mockReturnValue([]);

    // Set private key with escaped newlines
    process.env.FIREBASE_PRIVATE_KEY = 'test-private-key\\nwith\\nnewlines';

    // Re-import the module to trigger initialization
    jest.isolateModules(async () => {
      await import('@/lib/firebase-admin');
    });

    // Check if cert was called with correct params (newlines replaced)
    expect(cert).toHaveBeenCalledWith({
      projectId: 'test-project-id',
      clientEmail: 'test-client-email',
      privateKey: 'test-private-key\nwith\nnewlines',
    });
  });

  it('should reuse existing Firebase Admin app if available', () => {
    // Mock getApps to return an existing app
    const mockApp = { name: 'test-admin-app' };
    (getApps as jest.Mock).mockReturnValue([mockApp]);

    // Re-import the module to trigger initialization
    jest.isolateModules(async () => {
      await import('@/lib/firebase-admin');
    });

    // Check that initializeApp was not called
    expect(initializeApp).not.toHaveBeenCalled();

    // Check that getFirestore was called with the existing app
    expect(getFirestore).toHaveBeenCalledWith(mockApp);
  });

  it('should configure Firestore to ignore undefined properties', () => {
    // Re-import the module to trigger initialization
    jest.isolateModules(async () => {
      await import('@/lib/firebase-admin');
    });

    // Check that settings was called with ignoreUndefinedProperties: true
    expect(mockSettings).toHaveBeenCalledWith({ ignoreUndefinedProperties: true });
  });

  it('should export Firestore admin database instance', async () => {
    // Mock getFirestore to return a mock db
    const mockDb = { settings: mockSettings };
    (getFirestore as jest.Mock).mockReturnValue(mockDb);

    // Re-import the module to get the exported adminDb
    await jest.isolateModules(async () => {
      const firebaseAdmin = await import('@/lib/firebase-admin');
      expect(firebaseAdmin.adminDb).toBe(mockDb);
    });
  });
});
