/**
 * @fileoverview Backend utility functions for LifeSync
 * @module utils/helpers
 * @description Pure utility functions for validation, permissions, and data transformation
 */

/**
 * Role hierarchy for permission checking
 * @constant {Object}
 */
const ROLE_HIERARCHY = {
  owner: 4,
  moderator: 3,
  member: 2,
  viewer: 1,
};

/**
 * Valid role values
 * @constant {string[]}
 */
const VALID_ROLES = ['owner', 'moderator', 'member', 'viewer'];

/**
 * Valid task statuses
 * @constant {string[]}
 */
const VALID_TASK_STATUSES = ['pending', 'in-progress', 'completed'];

/**
 * Valid task priorities
 * @constant {string[]}
 */
const VALID_PRIORITIES = ['low', 'medium', 'high'];

// ============================================================================
// METHOD 1: validateEmail
// ============================================================================
/**
 * Validates an email address format
 * @function validateEmail
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 *
 * @example
 * validateEmail('user@example.com') // true
 * validateEmail('invalid') // false
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// ============================================================================
// METHOD 2: validatePassword
// ============================================================================
/**
 * Validates password meets minimum requirements
 * @function validatePassword
 * @param {string} password - Password to validate
 * @param {number} [minLength=6] - Minimum required length
 * @returns {{ valid: boolean, message: string }} Validation result
 *
 * @example
 * validatePassword('abc123') // { valid: true, message: 'Valid' }
 * validatePassword('short') // { valid: false, message: 'Password must be at least 6 characters' }
 */
function validatePassword(password, minLength = 6) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < minLength) {
    return { valid: false, message: `Password must be at least ${minLength} characters` };
  }

  return { valid: true, message: 'Valid' };
}

// ============================================================================
// METHOD 3: checkPermission
// ============================================================================
/**
 * Checks if a user role has permission for an action based on role hierarchy
 * @function checkPermission
 * @param {string} userRole - The user's current role
 * @param {string} requiredRole - The minimum role required for the action
 * @returns {boolean} True if user has sufficient permission
 *
 * @example
 * checkPermission('owner', 'moderator') // true
 * checkPermission('member', 'moderator') // false
 * checkPermission('moderator', 'moderator') // true
 */
function checkPermission(userRole, requiredRole) {
  if (!userRole || !requiredRole) {
    return false;
  }

  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase()];
  const requiredLevel = ROLE_HIERARCHY[requiredRole.toLowerCase()];

  if (userLevel === undefined || requiredLevel === undefined) {
    return false;
  }

  return userLevel >= requiredLevel;
}

// ============================================================================
// METHOD 4: sanitizeInput
// ============================================================================
/**
 * Sanitizes user input by trimming whitespace and removing dangerous characters
 * @function sanitizeInput
 * @param {string} input - Raw user input
 * @returns {string} Sanitized string
 *
 * @example
 * sanitizeInput('  hello  ') // 'hello'
 * sanitizeInput('<script>alert("xss")</script>') // 'scriptalert("xss")/script'
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

// ============================================================================
// METHOD 5: calculateTaskStats
// ============================================================================
/**
 * Calculates task statistics from an array of tasks
 * @function calculateTaskStats
 * @param {Array} tasks - Array of task objects with status property
 * @returns {{ total: number, completed: number, pending: number, inProgress: number, completionRate: number }}
 *
 * @example
 * calculateTaskStats([{ status: 'completed' }, { status: 'pending' }])
 * // { total: 2, completed: 1, pending: 1, inProgress: 0, completionRate: 50 }
 */
function calculateTaskStats(tasks) {
  const defaultStats = {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    completionRate: 0,
  };

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return defaultStats;
  }

  const stats = tasks.reduce(
    (acc, task) => {
      acc.total++;

      switch (task.status) {
        case 'completed':
          acc.completed++;
          break;
        case 'pending':
          acc.pending++;
          break;
        case 'in-progress':
          acc.inProgress++;
          break;
      }

      return acc;
    },
    { ...defaultStats }
  );

  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return stats;
}

// ============================================================================
// Additional exports for validation
// ============================================================================

/**
 * Validates if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
function isValidRole(role) {
  if (!role || typeof role !== 'string') {
    return false;
  }
  return VALID_ROLES.includes(role.toLowerCase());
}

/**
 * Validates if a task status is valid
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
function isValidTaskStatus(status) {
  if (!status || typeof status !== 'string') {
    return false;
  }
  return VALID_TASK_STATUSES.includes(status.toLowerCase());
}

/**
 * Validates if a priority is valid
 * @param {string} priority - Priority to validate
 * @returns {boolean} True if valid priority
 */
function isValidPriority(priority) {
  if (!priority || typeof priority !== 'string') {
    return false;
  }
  return VALID_PRIORITIES.includes(priority.toLowerCase());
}

module.exports = {
  validateEmail,
  validatePassword,
  checkPermission,
  sanitizeInput,
  calculateTaskStats,
  isValidRole,
  isValidTaskStatus,
  isValidPriority,
  ROLE_HIERARCHY,
  VALID_ROLES,
  VALID_TASK_STATUSES,
  VALID_PRIORITIES,
};
