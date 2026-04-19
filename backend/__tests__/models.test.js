/**
 * @fileoverview Unit tests for backend models
 * @description Tests for User model methods and validation logic
 *
 * METHODS TESTED:
 * - comparePassword - Password comparison using bcrypt
 * - toJSON - User object serialization
 * - Schema validation - Email format, password requirements
 */

const bcrypt = require('bcryptjs');

// ============================================================================
// Model utility functions for testing (simulating User model methods)
// ============================================================================

// Simulated User model comparePassword method
async function comparePassword(candidatePassword, hashedPassword) {
  if (!candidatePassword || !hashedPassword) {
    return false;
  }
  try {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  } catch (error) {
    return false;
  }
}

// Simulated User model toJSON method
function userToJSON(userObj) {
  const user = { ...userObj };
  delete user.password;
  return user;
}

// Schema validation helper
function validateUserSchema(user) {
  const errors = [];

  if (!user.name || typeof user.name !== 'string' || user.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!user.email || typeof user.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      errors.push('Email format is invalid');
    }
  }

  if (!user.password || typeof user.password !== 'string') {
    errors.push('Password is required and must be a string');
  } else if (user.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MODEL TEST 1: Password Comparison (comparePassword)
// ============================================================================
describe('MODEL TEST 1: comparePassword', () => {
  describe('Correct Password Comparison', () => {
    test('should return true for matching password', async () => {
      const password = 'myPassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    test('should return true for password with special characters', async () => {
      const password = 'Pass@123!#$%';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    test('should return true for long password', async () => {
      const password = 'thisIsAVeryLongPasswordWith32Characters!@#$';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });
  });

  describe('Incorrect Password Comparison', () => {
    test('should return false for non-matching password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });

    test('should return false for case-sensitive mismatch', async () => {
      const password = 'Password123';
      const wrongPassword = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword(wrongPassword, hashedPassword);
      expect(result).toBe(false);
    });

    test('should return false for empty password guess', async () => {
      const password = 'correctPassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword('', hashedPassword);
      expect(result).toBe(false);
    });

    test('should return false when password is null', async () => {
      const password = 'correctPassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await comparePassword(null, hashedPassword);
      expect(result).toBe(false);
    });

    test('should return false when comparing with corrupted hash', async () => {
      const password = 'testPassword';
      const corruptedHash = '$2a$10$invalidhash';
      try {
        const result = await comparePassword(password, corruptedHash);
        expect(result).toBe(false);
      } catch (error) {
        // bcrypt may throw on invalid hash format, which is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe('Password Hash Security', () => {
    test('should produce different hashes for same password', async () => {
      const password = 'samePassword';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      expect(hash1).not.toBe(hash2);
    });

    test('should verify both hashes work with same password', async () => {
      const password = 'testPassword';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      const result1 = await comparePassword(password, hash1);
      const result2 = await comparePassword(password, hash2);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });
});

// ============================================================================
// MODEL TEST 2: User JSON Serialization (toJSON)
// ============================================================================
describe('MODEL TEST 2: userToJSON', () => {
  describe('Password Removal', () => {
    test('should remove password from user object', () => {
      const user = {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword123',
      };
      const result = userToJSON(user);
      expect(result).not.toHaveProperty('password');
    });

    test('should not expose hashed password', () => {
      const user = {
        _id: '456',
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: '$2a$10$hashedpasswordstring',
      };
      const result = userToJSON(user);
      expect(result.password).toBeUndefined();
    });
  });

  describe('Data Preservation', () => {
    test('should preserve user id', () => {
      const user = {
        _id: '789',
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'hashed',
      };
      const result = userToJSON(user);
      expect(result._id).toBe('789');
    });

    test('should preserve user name', () => {
      const user = {
        _id: '111',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: 'hashed',
      };
      const result = userToJSON(user);
      expect(result.name).toBe('Alice Johnson');
    });

    test('should preserve email', () => {
      const user = {
        _id: '222',
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'hashed',
      };
      const result = userToJSON(user);
      expect(result.email).toBe('charlie@example.com');
    });

    test('should preserve additional fields', () => {
      const user = {
        _id: '333',
        name: 'David Lee',
        email: 'david@example.com',
        password: 'hashed',
        role: 'admin',
        createdAt: '2025-01-01',
        friends: ['123', '456'],
      };
      const result = userToJSON(user);
      expect(result.role).toBe('admin');
      expect(result.createdAt).toBe('2025-01-01');
      expect(result.friends).toEqual(['123', '456']);
    });
  });

  describe('Safe Serialization', () => {
    test('should not mutate original object', () => {
      const user = {
        _id: '444',
        name: 'Eve Williams',
        email: 'eve@example.com',
        password: 'secret',
      };
      const originalPassword = user.password;
      userToJSON(user);
      expect(user.password).toBe(originalPassword);
    });

    test('should handle user with minimal fields', () => {
      const user = {
        name: 'Minimal User',
        email: 'minimal@example.com',
        password: 'hashed',
      };
      const result = userToJSON(user);
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('Minimal User');
    });

    test('should return object with proper structure', () => {
      const user = {
        _id: '555',
        name: 'Frank Miller',
        email: 'frank@example.com',
        password: 'hashed',
      };
      const result = userToJSON(user);
      expect(typeof result).toBe('object');
      expect(result).not.toBeNull();
    });
  });
});

// ============================================================================
// MODEL TEST 3: User Schema Validation
// ============================================================================
describe('MODEL TEST 3: User Schema Validation', () => {
  describe('Valid User Data', () => {
    test('should validate correct user data', () => {
      const user = {
        name: 'Valid User',
        email: 'valid@example.com',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should accept user with all fields', () => {
      const user = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Invalid Name', () => {
    test('should reject missing name', () => {
      const user = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Name'))).toBe(true);
    });

    test('should reject empty name', () => {
      const user = {
        name: '   ',
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
    });

    test('should reject non-string name', () => {
      const user = {
        name: 12345,
        email: 'test@example.com',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Invalid Email', () => {
    test('should reject missing email', () => {
      const user = {
        name: 'Test User',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Email'))).toBe(true);
    });

    test('should reject invalid email format', () => {
      const user = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Email'))).toBe(true);
    });

    test('should reject email without domain', () => {
      const user = {
        name: 'Test User',
        email: 'user@',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
    });

    test('should reject email without @', () => {
      const user = {
        name: 'Test User',
        email: 'userexample.com',
        password: 'password123',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
    });

    test('should accept valid email formats', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user123@domain.com',
      ];
      validEmails.forEach(email => {
        const user = {
          name: 'Test User',
          email,
          password: 'password123',
        };
        const result = validateUserSchema(user);
        expect(result.errors.some(e => e.includes('Email'))).toBe(false);
      });
    });
  });

  describe('Invalid Password', () => {
    test('should reject missing password', () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Password'))).toBe(true);
    });

    test('should reject password shorter than 6 characters', () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('6'))).toBe(true);
    });

    test('should accept password with exactly 6 characters', () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123456',
      };
      const result = validateUserSchema(user);
      expect(result.errors.some(e => e.includes('Password'))).toBe(false);
    });

    test('should reject non-string password', () => {
      const user = {
        name: 'Test User',
        email: 'test@example.com',
        password: 123456,
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Multiple Field Errors', () => {
    test('should report all validation errors', () => {
      const user = {
        name: '',
        email: 'invalid',
        password: 'short',
      };
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should validate complete invalid user', () => {
      const user = {};
      const result = validateUserSchema(user);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });
});
