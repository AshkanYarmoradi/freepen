import { hashPassword } from '@/lib/db';

describe('hashPassword', () => {
  it('should hash a password', async () => {
    const password = 'testpassword';
    const hash = await hashPassword(password);
    
    // Check that the hash is a string
    expect(typeof hash).toBe('string');
    
    // Check that the hash is not the same as the password
    expect(hash).not.toBe(password);
    
    // Check that the hash is 64 characters long (SHA-256 produces 32 bytes, which is 64 hex characters)
    expect(hash.length).toBe(64);
    
    // Check that the hash only contains valid hex characters
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
  
  it('should produce the same hash for the same password', async () => {
    const password = 'testpassword';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    expect(hash1).toBe(hash2);
  });
  
  it('should produce different hashes for different passwords', async () => {
    const password1 = 'testpassword1';
    const password2 = 'testpassword2';
    const hash1 = await hashPassword(password1);
    const hash2 = await hashPassword(password2);
    
    expect(hash1).not.toBe(hash2);
  });
});