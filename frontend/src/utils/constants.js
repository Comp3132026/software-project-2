/**
 * @fileoverview Application-wide constants for LifeSync
 * @module utils/constants
 * @description Centralized constants following DRY principle - all repeated values defined once.
 */

/**
 * User roles within a group
 * @readonly
 * @enum {string}
 */
export const USER_ROLES = Object.freeze({
  OWNER: 'owner',
  MODERATOR: 'moderator',
  MEMBER: 'member',
  VIEWER: 'viewer',
});

/**
 * Task status values
 * @readonly
 * @enum {string}
 */
export const TASK_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
});

/**
 * Task priority levels
 * @readonly
 * @enum {string}
 */
export const TASK_PRIORITY = Object.freeze({
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
});

/**
 * Member status values
 * @readonly
 * @enum {string}
 */
export const MEMBER_STATUS = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  UNRESPONSIVE: 'unresponsive',
});

/**
 * Task/habit frequency options
 * @readonly
 * @enum {string}
 */
export const TASK_FREQUENCY = Object.freeze({
  ONCE: 'once',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
});

/**
 * Group categories
 * @readonly
 * @enum {string}
 */
export const GROUP_CATEGORIES = Object.freeze({
  HEALTH: 'Health',
  FITNESS: 'Fitness',
  PRODUCTIVITY: 'Productivity',
  LEARNING: 'Learning',
  FINANCE: 'Finance',
  SOCIAL: 'Social',
  OTHER: 'Other',
});

/**
 * Notification frequency options
 * @readonly
 * @enum {string}
 */
export const NOTIFICATION_FREQUENCY = Object.freeze({
  ONE_HOUR: '1h',
  SIX_HOURS: '6h',
  TWELVE_HOURS: '12h',
  ONE_DAY: '1d',
  THREE_DAYS: '3d',
  ONE_WEEK: '1w',
});

/**
 * Color palette for UI elements
 * @readonly
 * @enum {string}
 */
export const COLORS = Object.freeze({
  SUCCESS: '#22c55e',
  WARNING: '#facc15',
  DANGER: '#ef4444',
  INFO: '#3b82f6',
  PRIMARY: '#14b8a6',
  ACCENT: '#f97316',
});

/**
 * Message types for chat
 * @readonly
 * @enum {string}
 */
export const MESSAGE_TYPES = Object.freeze({
  NORMAL: 'normal',
  PROGRESS: 'progress',
  WARNING: 'warning',
  ANNOUNCEMENT: 'announcement',
});

/**
 * Notification types
 * @readonly
 * @enum {string}
 */
export const NOTIFICATION_TYPES = Object.freeze({
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  MEMBER_JOINED: 'member_joined',
  MEMBER_LEFT: 'member_left',
  ROLE_CHANGED: 'role_changed',
  GROUP_UPDATE: 'group_update',
  GROUP_DELETED: 'group_deleted',
});

/**
 * Validation constraints
 * @readonly
 * @enum {number}
 */
export const VALIDATION = Object.freeze({
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_PASSWORD_LENGTH: 6,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_MESSAGE_LENGTH: 2000,
});

/**
 * Pagination defaults
 * @readonly
 * @enum {number}
 */
export const PAGINATION = Object.freeze({
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
});

/**
 * HTTP status codes
 * @readonly
 * @enum {number}
 */
export const HTTP_STATUS = Object.freeze({
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
});

/**
 * Local storage keys
 * @readonly
 * @enum {string}
 */
export const STORAGE_KEYS = Object.freeze({
  TOKEN: 'token',
  USER: 'user',
});

/**
 * Warning reason presets for moderation
 * @readonly
 * @type {string[]}
 */
export const WARNING_PRESETS = Object.freeze([
  'Inappropriate language',
  'Off-topic discussion',
  'Spam or self-promotion',
  'Harassment or bullying',
  'Sharing sensitive information',
  'Repeated rule violations',
]);
