/**
 * @fileoverview Validation utilities for LifeSync
 * @module utils/validation
 * @description Provides validation functions for forms and data integrity
 */

import { VALIDATION, USER_ROLES, TASK_STATUS, TASK_PRIORITY, MEMBER_STATUS } from './constants';

/**
 * Validates an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 * @example
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password meets minimum requirements
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result with errors
 * @example
 * validatePassword('abc123') // { valid: true, errors: [] }
 * validatePassword('short') // { valid: false, errors: ['Password must be at least 6 characters'] }
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a name field (user name, group name, etc.)
 * @param {string} name - Name to validate
 * @param {string} [fieldName='Name'] - Field name for error messages
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 * @example
 * validateName('John Doe') // { valid: true, errors: [] }
 * validateName('A') // { valid: false, errors: ['Name must be at least 2 characters'] }
 */
export function validateName(name, fieldName = 'Name') {
  const errors = [];

  if (!name || typeof name !== 'string') {
    return { valid: false, errors: [`${fieldName} is required`] };
  }

  const trimmed = name.trim();

  if (trimmed.length < VALIDATION.MIN_NAME_LENGTH) {
    errors.push(`${fieldName} must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
  }

  if (trimmed.length > VALIDATION.MAX_NAME_LENGTH) {
    errors.push(`${fieldName} must be at most ${VALIDATION.MAX_NAME_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a task title
 * @param {string} title - Task title to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateTaskTitle(title) {
  const errors = [];

  if (!title || typeof title !== 'string') {
    return { valid: false, errors: ['Task title is required'] };
  }

  const trimmed = title.trim();

  if (trimmed.length < VALIDATION.MIN_NAME_LENGTH) {
    errors.push(`Title must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`);
  }

  if (trimmed.length > VALIDATION.MAX_TASK_TITLE_LENGTH) {
    errors.push(`Title must be at most ${VALIDATION.MAX_TASK_TITLE_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a description field
 * @param {string} description - Description to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateDescription(description) {
  const errors = [];

  // Description is optional, so empty is valid
  if (!description || typeof description !== 'string') {
    return { valid: true, errors: [] };
  }

  if (description.length > VALIDATION.MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description must be at most ${VALIDATION.MAX_DESCRIPTION_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a chat message
 * @param {string} message - Message to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateMessage(message) {
  const errors = [];

  if (!message || typeof message !== 'string') {
    return { valid: false, errors: ['Message is required'] };
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    errors.push('Message cannot be empty');
  }

  if (trimmed.length > VALIDATION.MAX_MESSAGE_LENGTH) {
    errors.push(`Message must be at most ${VALIDATION.MAX_MESSAGE_LENGTH} characters`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Checks if a value is a valid user role
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
export function isValidRole(role) {
  if (!role || typeof role !== 'string') {
    return false;
  }
  return Object.values(USER_ROLES).includes(role.toLowerCase());
}

/**
 * Checks if a value is a valid task status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
export function isValidTaskStatus(status) {
  if (!status || typeof status !== 'string') {
    return false;
  }
  return Object.values(TASK_STATUS).includes(status.toLowerCase());
}

/**
 * Checks if a value is a valid task priority
 * @param {string} priority - Priority to validate
 * @returns {boolean} True if valid priority
 */
export function isValidPriority(priority) {
  if (!priority || typeof priority !== 'string') {
    return false;
  }
  return Object.values(TASK_PRIORITY).includes(priority.toLowerCase());
}

/**
 * Checks if a value is a valid member status
 * @param {string} status - Status to validate
 * @returns {boolean} True if valid status
 */
export function isValidMemberStatus(status) {
  if (!status || typeof status !== 'string') {
    return false;
  }
  return Object.values(MEMBER_STATUS).includes(status.toLowerCase());
}

/**
 * Validates a due date is not in the past
 * @param {string|Date} dueDate - Due date to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
export function validateDueDate(dueDate) {
  const errors = [];

  // Due date is optional
  if (!dueDate) {
    return { valid: true, errors: [] };
  }

  const date = new Date(dueDate);

  if (isNaN(date.getTime())) {
    return { valid: false, errors: ['Invalid date format'] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (date < today) {
    errors.push('Due date cannot be in the past');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId format
 */
export function isValidObjectId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Sanitizes a string by trimming and removing excessive whitespace
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Validates complete registration form data
 * @param {{ name: string, email: string, password: string, confirmPassword: string }} data - Form data
 * @returns {{ valid: boolean, errors: Object }} Validation result with field-specific errors
 */
export function validateRegistrationForm(data) {
  const errors = {};

  const nameResult = validateName(data.name);
  if (!nameResult.valid) {
    errors.name = nameResult.errors[0];
  }

  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.errors[0];
  }

  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Validates complete task form data
 * @param {{ title: string, description?: string, dueDate?: string, priority?: string }} data - Task data
 * @returns {{ valid: boolean, errors: Object }} Validation result
 */
export function validateTaskForm(data) {
  const errors = {};

  const titleResult = validateTaskTitle(data.title);
  if (!titleResult.valid) {
    errors.title = titleResult.errors[0];
  }

  const descResult = validateDescription(data.description);
  if (!descResult.valid) {
    errors.description = descResult.errors[0];
  }

  if (data.priority && !isValidPriority(data.priority)) {
    errors.priority = 'Invalid priority value';
  }

  const dueDateResult = validateDueDate(data.dueDate);
  if (!dueDateResult.valid) {
    errors.dueDate = dueDateResult.errors[0];
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
