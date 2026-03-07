/**
 * @fileoverview Unit tests for backend helper utilities
 * @description Tests for 5 backend methods: validateEmail, validatePassword,
 * checkPermission, sanitizeInput, calculateTaskStats
 */

const {
  validateEmail,
  validatePassword,
  checkPermission,
  sanitizeInput,
  calculateTaskStats,
} = require('../utils/helpers');

// ============================================================================
// METHOD 1: validateEmail (Backend)
// ============================================================================
describe('BACKEND METHOD 1: validateEmail', () => {
  describe('Valid Emails', () => {
    test('should return true for standard email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    test('should return true for email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    test('should return true for email with plus sign', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    test('should return true for email with numbers', () => {
      expect(validateEmail('user123@example456.com')).toBe(true);
    });

    test('should return true for email with dots in local part', () => {
      expect(validateEmail('first.last@example.com')).toBe(true);
    });

    test('should trim whitespace and validate', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('Invalid Emails', () => {
    test('should return false for email without @', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    test('should return false for email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    test('should return false for email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    test('should return false for email with spaces in middle', () => {
      expect(validateEmail('user @example.com')).toBe(false);
    });

    test('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    test('should return false for null', () => {
      expect(validateEmail(null)).toBe(false);
    });

    test('should return false for undefined', () => {
      expect(validateEmail(undefined)).toBe(false);
    });

    test('should return false for number', () => {
      expect(validateEmail(12345)).toBe(false);
    });
  });
});

// ============================================================================
// METHOD 2: validatePassword (Backend)
// ============================================================================
describe('BACKEND METHOD 2: validatePassword', () => {
  describe('Valid Passwords', () => {
    test('should return valid for password with exactly 6 characters', () => {
      const result = validatePassword('abc123');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('Valid');
    });

    test('should return valid for password with more than 6 characters', () => {
      const result = validatePassword('securePassword123!');
      expect(result.valid).toBe(true);
    });

    test('should return valid for password with special characters', () => {
      const result = validatePassword('P@ssw0rd!');
      expect(result.valid).toBe(true);
    });

    test('should respect custom minimum length', () => {
      const result = validatePassword('12345678', 8);
      expect(result.valid).toBe(true);
    });
  });

  describe('Invalid Passwords', () => {
    test('should return invalid for password with less than 6 characters', () => {
      const result = validatePassword('abc12');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 6 characters');
    });

    test('should return invalid for empty password', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    test('should return invalid for null password', () => {
      const result = validatePassword(null);
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Password is required');
    });

    test('should return invalid for undefined password', () => {
      const result = validatePassword(undefined);
      expect(result.valid).toBe(false);
    });

    test('should fail custom minimum length check', () => {
      const result = validatePassword('short', 10);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 10 characters');
    });
  });
});

// ============================================================================
// METHOD 3: checkPermission (Backend)
// ============================================================================
describe('BACKEND METHOD 3: checkPermission', () => {
  describe('Owner Permissions', () => {
    test('owner should have permission for owner actions', () => {
      expect(checkPermission('owner', 'owner')).toBe(true);
    });

    test('owner should have permission for moderator actions', () => {
      expect(checkPermission('owner', 'moderator')).toBe(true);
    });

    test('owner should have permission for member actions', () => {
      expect(checkPermission('owner', 'member')).toBe(true);
    });

    test('owner should have permission for viewer actions', () => {
      expect(checkPermission('owner', 'viewer')).toBe(true);
    });
  });

  describe('Moderator Permissions', () => {
    test('moderator should NOT have permission for owner actions', () => {
      expect(checkPermission('moderator', 'owner')).toBe(false);
    });

    test('moderator should have permission for moderator actions', () => {
      expect(checkPermission('moderator', 'moderator')).toBe(true);
    });

    test('moderator should have permission for member actions', () => {
      expect(checkPermission('moderator', 'member')).toBe(true);
    });

    test('moderator should have permission for viewer actions', () => {
      expect(checkPermission('moderator', 'viewer')).toBe(true);
    });
  });

  describe('Member Permissions', () => {
    test('member should NOT have permission for owner actions', () => {
      expect(checkPermission('member', 'owner')).toBe(false);
    });

    test('member should NOT have permission for moderator actions', () => {
      expect(checkPermission('member', 'moderator')).toBe(false);
    });

    test('member should have permission for member actions', () => {
      expect(checkPermission('member', 'member')).toBe(true);
    });

    test('member should have permission for viewer actions', () => {
      expect(checkPermission('member', 'viewer')).toBe(true);
    });
  });

  describe('Viewer Permissions', () => {
    test('viewer should NOT have permission for owner actions', () => {
      expect(checkPermission('viewer', 'owner')).toBe(false);
    });

    test('viewer should NOT have permission for moderator actions', () => {
      expect(checkPermission('viewer', 'moderator')).toBe(false);
    });

    test('viewer should NOT have permission for member actions', () => {
      expect(checkPermission('viewer', 'member')).toBe(false);
    });

    test('viewer should have permission for viewer actions', () => {
      expect(checkPermission('viewer', 'viewer')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should return false for null user role', () => {
      expect(checkPermission(null, 'member')).toBe(false);
    });

    test('should return false for null required role', () => {
      expect(checkPermission('owner', null)).toBe(false);
    });

    test('should return false for invalid user role', () => {
      expect(checkPermission('admin', 'member')).toBe(false);
    });

    test('should return false for invalid required role', () => {
      expect(checkPermission('owner', 'superuser')).toBe(false);
    });

    test('should be case insensitive', () => {
      expect(checkPermission('OWNER', 'moderator')).toBe(true);
      expect(checkPermission('Owner', 'MEMBER')).toBe(true);
    });
  });
});

// ============================================================================
// METHOD 4: sanitizeInput (Backend)
// ============================================================================
describe('BACKEND METHOD 4: sanitizeInput', () => {
  describe('Whitespace Handling', () => {
    test('should trim leading whitespace', () => {
      expect(sanitizeInput('  hello')).toBe('hello');
    });

    test('should trim trailing whitespace', () => {
      expect(sanitizeInput('hello  ')).toBe('hello');
    });

    test('should trim both leading and trailing whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    test('should collapse multiple spaces to single space', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world');
    });

    test('should handle tabs and newlines', () => {
      expect(sanitizeInput('hello\t\nworld')).toBe('hello world');
    });
  });

  describe('Dangerous Character Removal', () => {
    test('should remove less-than signs', () => {
      expect(sanitizeInput('hello<world')).toBe('helloworld');
    });

    test('should remove greater-than signs', () => {
      expect(sanitizeInput('hello>world')).toBe('helloworld');
    });

    test('should remove script tags', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    test('should handle multiple angle brackets', () => {
      expect(sanitizeInput('<<hello>>')).toBe('hello');
    });
  });

  describe('Edge Cases', () => {
    test('should return empty string for null', () => {
      expect(sanitizeInput(null)).toBe('');
    });

    test('should return empty string for undefined', () => {
      expect(sanitizeInput(undefined)).toBe('');
    });

    test('should return empty string for number', () => {
      expect(sanitizeInput(12345)).toBe('');
    });

    test('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    test('should handle already clean string', () => {
      expect(sanitizeInput('hello world')).toBe('hello world');
    });
  });
});

// ============================================================================
// METHOD 5: calculateTaskStats (Backend)
// ============================================================================
describe('BACKEND METHOD 5: calculateTaskStats', () => {
  describe('Basic Statistics', () => {
    test('should calculate stats for mixed status tasks', () => {
      const tasks = [
        { status: 'completed' },
        { status: 'completed' },
        { status: 'pending' },
        { status: 'in-progress' },
      ];

      const stats = calculateTaskStats(tasks);

      expect(stats.total).toBe(4);
      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.completionRate).toBe(50);
    });

    test('should calculate 100% completion rate', () => {
      const tasks = [{ status: 'completed' }, { status: 'completed' }, { status: 'completed' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.completionRate).toBe(100);
    });

    test('should calculate 0% completion rate', () => {
      const tasks = [{ status: 'pending' }, { status: 'in-progress' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.completionRate).toBe(0);
    });

    test('should round completion rate to nearest integer', () => {
      const tasks = [{ status: 'completed' }, { status: 'pending' }, { status: 'pending' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.completionRate).toBe(33); // 33.33% rounds to 33
    });
  });

  describe('Single Status Arrays', () => {
    test('should handle all completed tasks', () => {
      const tasks = [{ status: 'completed' }, { status: 'completed' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.completed).toBe(2);
      expect(stats.pending).toBe(0);
      expect(stats.inProgress).toBe(0);
    });

    test('should handle all pending tasks', () => {
      const tasks = [{ status: 'pending' }, { status: 'pending' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.completed).toBe(0);
      expect(stats.pending).toBe(2);
    });

    test('should handle all in-progress tasks', () => {
      const tasks = [{ status: 'in-progress' }, { status: 'in-progress' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.inProgress).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    test('should return default stats for empty array', () => {
      const stats = calculateTaskStats([]);

      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.pending).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    test('should return default stats for null', () => {
      const stats = calculateTaskStats(null);

      expect(stats.total).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    test('should return default stats for undefined', () => {
      const stats = calculateTaskStats(undefined);

      expect(stats.total).toBe(0);
    });

    test('should return default stats for non-array', () => {
      const stats = calculateTaskStats('not an array');

      expect(stats.total).toBe(0);
    });

    test('should handle tasks with unknown status', () => {
      const tasks = [{ status: 'completed' }, { status: 'unknown' }];

      const stats = calculateTaskStats(tasks);

      expect(stats.total).toBe(2);
      expect(stats.completed).toBe(1);
    });
  });
});
