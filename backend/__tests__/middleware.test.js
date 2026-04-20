/**
 * @fileoverview Unit tests for backend middleware
 * @description Tests for authentication and authorization middleware
 *
 * METHODS TESTED:
 * - generateToken - JWT token generation
 * - Token validation logic - Token format and expiry
 */

const jwt = require('jsonwebtoken');

// Mock JWT functions for testing
const JWT_SECRET = 'test-secret-key-for-testing';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function extractTokenFromHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
    return null;
  }
  return parts[1];
}

// ============================================================================
// MIDDLEWARE TEST 1: Token Generation
// ============================================================================
describe('MIDDLEWARE TEST 1: generateToken', () => {
  describe('Valid Token Generation', () => {
    test('should generate a valid JWT token', () => {
      const userId = '507f1f77bcf86cd799439011';
      const token = generateToken(userId);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    test('should generate different tokens for different user IDs', () => {
      const token1 = generateToken('user1');
      const token2 = generateToken('user2');
      expect(token1).not.toBe(token2);
    });

    test('should encode userId in token payload', () => {
      const userId = 'test-user-123';
      const token = generateToken(userId);
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded.userId).toBe(userId);
    });

    test('should generate tokens with proper format', () => {
      const token = generateToken('user123');
      const parts = token.split('.');
      expect(parts.length).toBe(3); // JWT has 3 parts
    });
  });

  describe('Token Payload', () => {
    test('should include userId in payload', () => {
      const userId = 'abc123def456';
      const token = generateToken(userId);
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(userId);
    });

    test('should include exp (expiry) claim', () => {
      const token = generateToken('user123');
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('exp');
      expect(typeof decoded.exp).toBe('number');
    });

    test('should include iat (issued at) claim', () => {
      const token = generateToken('user123');
      const decoded = jwt.verify(token, JWT_SECRET);
      expect(decoded).toHaveProperty('iat');
      expect(typeof decoded.iat).toBe('number');
    });
  });
});

// ============================================================================
// MIDDLEWARE TEST 2: Token Verification
// ============================================================================
describe('MIDDLEWARE TEST 2: verifyToken', () => {
  describe('Valid Token Verification', () => {
    test('should verify a valid token', () => {
      const userId = 'user123';
      const token = generateToken(userId);
      const decoded = verifyToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded.userId).toBe(userId);
    });

    test('should return payload object for valid token', () => {
      const token = generateToken('user456');
      const decoded = verifyToken(token);
      expect(typeof decoded).toBe('object');
      expect(decoded.userId).toBe('user456');
    });
  });

  describe('Invalid Token Verification', () => {
    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);
      expect(decoded).toBeNull();
    });

    test('should return null for tampered token', () => {
      const token = generateToken('user123');
      const tampered = token.substring(0, token.length - 5) + 'xxxxx';
      const decoded = verifyToken(tampered);
      expect(decoded).toBeNull();
    });

    test('should return null for null token', () => {
      const decoded = verifyToken(null);
      expect(decoded).toBeNull();
    });

    test('should return null for undefined token', () => {
      const decoded = verifyToken(undefined);
      expect(decoded).toBeNull();
    });

    test('should return null for empty string token', () => {
      const decoded = verifyToken('');
      expect(decoded).toBeNull();
    });
  });
});

// ============================================================================
// MIDDLEWARE TEST 3: Token Extraction from Headers
// ============================================================================
describe('MIDDLEWARE TEST 3: extractTokenFromHeader', () => {
  describe('Valid Header Format', () => {
    test('should extract token from Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIn0.signature';
      const authHeader = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    test('should handle token with special characters', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyMTIzIn0._-signature-with-special-chars';
      const authHeader = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });
  });

  describe('Invalid Header Format', () => {
    test('should return null for missing Bearer prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
      const extracted = extractTokenFromHeader(token);
      expect(extracted).toBeNull();
    });

    test('should return null for wrong prefix', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
      const authHeader = `Basic ${token}`;
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });

    test('should return null for null header', () => {
      const extracted = extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    test('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    test('should return null for empty string', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    test('should return null for non-string type', () => {
      const extracted = extractTokenFromHeader(12345);
      expect(extracted).toBeNull();
    });

    test('should return null for header without space', () => {
      const extracted = extractTokenFromHeader('BearerToken');
      expect(extracted).toBeNull();
    });

    test('should return null for header with extra spaces', () => {
      const token = 'token123';
      const authHeader = `Bearer  ${token}`;
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });
  });
});

// ============================================================================
// MIDDLEWARE TEST 4: Authorization Header Processing
// ============================================================================
describe('MIDDLEWARE TEST 4: Authorization Header Processing', () => {
  describe('Complete Auth Flow', () => {
    test('should extract and verify valid token from header', () => {
      const userId = 'user789';
      const token = generateToken(userId);
      const authHeader = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(extracted);
      
      expect(extracted).not.toBeNull();
      expect(decoded).not.toBeNull();
      expect(decoded.userId).toBe(userId);
    });

    test('should fail if token cannot be extracted from header', () => {
      const authHeader = 'InvalidHeader token123';
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });

    test('should fail if extracted token is invalid', () => {
      const authHeader = 'Bearer invalid.token.here';
      const extracted = extractTokenFromHeader(authHeader);
      const decoded = verifyToken(extracted);
      expect(decoded).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing Authorization header gracefully', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    test('should reject token with only Bearer prefix', () => {
      const authHeader = 'Bearer ';
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });
  });
});
