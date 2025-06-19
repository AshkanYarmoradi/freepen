import { 
  SessionData, 
  getSession, 
  createSession, 
  addAuthenticatedRoom, 
  isRoomAuthenticated, 
  verifyCsrfToken 
} from '../../lib/session';

// Mock iron-session
jest.mock('iron-session', () => {
  return {
    getIronSession: jest.fn().mockImplementation(async () => {
      return mockSession;
    }),
  };
});

// Mock next/headers
jest.mock('next/headers', () => {
  return {
    cookies: jest.fn().mockResolvedValue({}),
  };
});

// Mock crypto
jest.mock('crypto', () => {
  let counter = 0;
  return {
    randomBytes: jest.fn().mockImplementation(() => {
      return {
        toString: jest.fn().mockReturnValue('mock-random-bytes'),
      };
    }),
    randomUUID: jest.fn().mockImplementation(() => {
      counter++;
      return `mock-uuid-${counter}`;
    }),
  };
});

// Create a mock session object
const mockSession: Partial<SessionData> & { save: jest.Mock } = {
  isLoggedIn: false,
  userId: '',
  userName: '',
  authenticatedRooms: [],
  csrfToken: '',
  save: jest.fn().mockResolvedValue(undefined),
};

describe('session', () => {
  beforeEach(() => {
    // Reset the mock session before each test
    mockSession.isLoggedIn = false;
    mockSession.userId = '';
    mockSession.userName = '';
    mockSession.authenticatedRooms = [];
    mockSession.csrfToken = '';
    mockSession.save.mockClear();
  });

  describe('sessionOptions', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalSessionSecret = process.env.SESSION_SECRET;

    afterEach(() => {
      // Restore environment variables
      process.env.NODE_ENV = originalNodeEnv;
      process.env.SESSION_SECRET = originalSessionSecret;
    });

    it('should use SESSION_SECRET from environment if available', async () => {
      process.env.SESSION_SECRET = 'test-secret';
      // Re-import to get fresh options
      jest.resetModules();
      const { sessionOptions } = await import('../../lib/session');
      expect(sessionOptions.password).toBe('test-secret');
    });

    it('should generate a random password in development if SESSION_SECRET is not set', async () => {
      process.env.NODE_ENV = 'development';
      process.env.SESSION_SECRET = undefined;
      // Re-import to get fresh options
      jest.resetModules();
      const { sessionOptions } = await import('../../lib/session');
      expect(sessionOptions.password).toBe('mock-random-bytes');
    });

    it('should set secure cookie option based on environment', async () => {
      process.env.NODE_ENV = 'production';
      // Re-import to get fresh options
      jest.resetModules();
      const { sessionOptions } = await import('../../lib/session');
      expect(sessionOptions.cookieOptions.secure).toBe(true);

      process.env.NODE_ENV = 'development';
      // Re-import to get fresh options
      jest.resetModules();
      const { sessionOptions: devOptions } = await import('../../lib/session');
      expect(devOptions.cookieOptions.secure).toBe(false);
    });
  });

  describe('getSession', () => {
    it('should initialize a new session if not logged in', async () => {
      mockSession.isLoggedIn = false;

      const session = await getSession();

      expect(session.isLoggedIn).toBe(false);
      expect(session.userId).toBe('');
      expect(session.userName).toBe('');
      expect(session.authenticatedRooms).toEqual([]);
      expect(session.csrfToken).toBe('');
    });

    it('should return existing session if logged in', async () => {
      mockSession.isLoggedIn = true;
      mockSession.userId = 'existing-user-id';
      mockSession.userName = 'Existing User';
      mockSession.authenticatedRooms = ['room1', 'room2'];
      mockSession.csrfToken = 'existing-csrf-token';

      const session = await getSession();

      expect(session.isLoggedIn).toBe(true);
      expect(session.userId).toBe('existing-user-id');
      expect(session.userName).toBe('Existing User');
      expect(session.authenticatedRooms).toEqual(['room1', 'room2']);
      expect(session.csrfToken).toBe('existing-csrf-token');
    });
  });

  describe('createSession', () => {
    it('should create a new session with the provided username', async () => {
      await createSession('Test User');

      expect(mockSession.isLoggedIn).toBe(true);
      expect(mockSession.userId).toBe('mock-uuid-1');
      expect(mockSession.userName).toBe('Test User');
      expect(mockSession.authenticatedRooms).toEqual([]);
      expect(mockSession.csrfToken).toBe('mock-uuid-2');
      expect(mockSession.save).toHaveBeenCalled();
    });
  });

  describe('addAuthenticatedRoom', () => {
    it('should add a room to authenticatedRooms if not already present', async () => {
      mockSession.authenticatedRooms = ['room1'];

      await addAuthenticatedRoom('room2');

      expect(mockSession.authenticatedRooms).toEqual(['room1', 'room2']);
      expect(mockSession.save).toHaveBeenCalled();
    });

    it('should not add a room if already present', async () => {
      mockSession.authenticatedRooms = ['room1', 'room2'];

      await addAuthenticatedRoom('room2');

      expect(mockSession.authenticatedRooms).toEqual(['room1', 'room2']);
      expect(mockSession.save).toHaveBeenCalled();
    });
  });

  describe('isRoomAuthenticated', () => {
    it('should return true if room is in authenticatedRooms', () => {
      const session: SessionData = {
        isLoggedIn: true,
        userId: 'user-id',
        userName: 'User',
        authenticatedRooms: ['room1', 'room2'],
        csrfToken: 'csrf-token',
      };

      expect(isRoomAuthenticated(session, 'room1')).toBe(true);
    });

    it('should return false if room is not in authenticatedRooms', () => {
      const session: SessionData = {
        isLoggedIn: true,
        userId: 'user-id',
        userName: 'User',
        authenticatedRooms: ['room1', 'room2'],
        csrfToken: 'csrf-token',
      };

      expect(isRoomAuthenticated(session, 'room3')).toBe(false);
    });
  });

  describe('verifyCsrfToken', () => {
    it('should return true if token matches session csrfToken', () => {
      const session: SessionData = {
        isLoggedIn: true,
        userId: 'user-id',
        userName: 'User',
        authenticatedRooms: [],
        csrfToken: 'valid-csrf-token',
      };

      expect(verifyCsrfToken(session, 'valid-csrf-token')).toBe(true);
    });

    it('should return false if token does not match session csrfToken', () => {
      const session: SessionData = {
        isLoggedIn: true,
        userId: 'user-id',
        userName: 'User',
        authenticatedRooms: [],
        csrfToken: 'valid-csrf-token',
      };

      expect(verifyCsrfToken(session, 'invalid-csrf-token')).toBe(false);
    });
  });
});
