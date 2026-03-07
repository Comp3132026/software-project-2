/**
 * @fileoverview Task filtering and status utilities
 * @module hooks/filterTasks
 * @description Provides utilities for filtering, sorting, and categorizing tasks
 * and members. Includes helper functions for UI badge generation.
 */

import { TASK_STATUS, TASK_PRIORITY, COLORS } from '../utils/constants';

/**
 * @typedef {Object} Task
 * @property {string} _id - Task unique identifier
 * @property {string} title - Task title
 * @property {string} status - Task status (pending, in-progress, completed)
 * @property {string} priority - Task priority (low, medium, high)
 * @property {Date|string} [dueDate] - Optional due date
 */

/**
 * @typedef {Object} FilterOptions
 * @property {boolean} completed - Include completed tasks
 * @property {boolean} pending - Include pending tasks
 * @property {boolean} overdue - Include overdue tasks
 */

/**
 * @typedef {Object} BadgeConfig
 * @property {string} label - Display label for the badge
 * @property {string} className - CSS classes for styling
 */

/**
 * Checks if a task is overdue based on its due date
 *
 * @function isOverdue
 * @param {Date|string|null} dueDate - The task's due date
 * @returns {boolean} True if the task is past its due date
 *
 * @example
 * isOverdue('2023-01-01'); // true (past date)
 * isOverdue('2030-12-31'); // false (future date)
 * isOverdue(null); // false
 */
export const isOverdue = (dueDate) => {
  if (!dueDate) {
    return false;
  }
  const due = new Date(dueDate);
  const now = new Date();
  return due < now;
};

/**
 * Formats a date for display
 *
 * @function formatDate
 * @param {Date|string|null} date - The date to format
 * @returns {string} Formatted date string or placeholder text
 *
 * @example
 * formatDate('2025-12-25'); // "12/25/2025" (locale dependent)
 * formatDate(null); // "No due date"
 */
export const formatDate = (date) => {
  if (!date) {
    return 'No due date';
  }
  return new Date(date).toLocaleDateString();
};

/**
 * Filter type constants
 * @readonly
 * @enum {string}
 * @private
 */
const FILTER_TYPES = Object.freeze({
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
  HIGH: 'high',
  OVERDUE: 'overdue',
});

/**
 * Filters an array of tasks based on the specified filter criteria
 *
 * @function filterTasks
 * @param {Task[]} tasks - Array of tasks to filter
 * @param {string} filter - Filter type (all, pending, completed, high, overdue)
 * @returns {Task[]} Filtered array of tasks
 *
 * @description
 * Algorithm:
 * 1. Validate input - return empty array if tasks is not an array
 * 2. If filter is 'all', return all tasks unchanged
 * 3. Apply appropriate filter predicate based on filter type
 * 4. Return filtered results
 *
 * Time Complexity: O(n) where n is the number of tasks
 * Space Complexity: O(n) for the filtered result array
 *
 * @example
 * const tasks = [{ status: 'pending' }, { status: 'completed' }];
 * filterTasks(tasks, 'pending'); // [{ status: 'pending' }]
 */
export const filterTasks = (tasks, filter) => {
  // Guard clause: ensure tasks is a valid array
  if (!Array.isArray(tasks)) {
    return [];
  }

  // Return all tasks if no specific filter applied
  if (filter === FILTER_TYPES.ALL) {
    return tasks;
  }

  // Apply filter based on type using switch for clarity
  switch (filter) {
    case FILTER_TYPES.PENDING:
      return tasks.filter((task) => task.status === TASK_STATUS.PENDING);

    case FILTER_TYPES.COMPLETED:
      return tasks.filter((task) => task.status === TASK_STATUS.COMPLETED);

    case FILTER_TYPES.HIGH:
      return tasks.filter((task) => task.priority === TASK_PRIORITY.HIGH);

    case FILTER_TYPES.OVERDUE:
      return tasks.filter((task) => isOverdue(task.dueDate));

    default:
      return tasks;
  }
};

/**
 * @typedef {Object} GroupedTasks
 * @property {Task[]} completed - Array of completed tasks
 * @property {Task[]} pending - Array of pending tasks
 * @property {Task[]} overdue - Array of overdue tasks
 */

/**
 * Filters and groups tasks for dashboard display
 *
 * @function filterDashboardTasks
 * @param {Task[]} [tasks=[]] - Array of tasks to filter and group
 * @param {FilterOptions} filters - Object specifying which categories to include
 * @returns {GroupedTasks} Object containing arrays of tasks grouped by status
 *
 * @description
 * Algorithm:
 * 1. Initialize empty groups for each status category
 * 2. Iterate through tasks once, categorizing each by status
 * 3. If no filters are active, return all grouped tasks
 * 4. Otherwise, return only the groups matching active filters
 *
 * Time Complexity: O(n) - single pass through tasks array
 * Space Complexity: O(n) - stores references in grouped arrays
 *
 * @example
 * const tasks = [{ status: 'completed' }, { status: 'pending' }];
 * const filters = { completed: true, pending: false, overdue: false };
 * filterDashboardTasks(tasks, filters);
 * // { completed: [{ status: 'completed' }], pending: [], overdue: [] }
 */
export const filterDashboardTasks = (tasks = [], filters) => {
  // Initialize grouped task containers
  const grouped = {
    completed: [],
    pending: [],
    overdue: [],
  };

  // Single-pass categorization for O(n) performance
  tasks.forEach((task) => {
    if (task.status === TASK_STATUS.COMPLETED) {
      grouped.completed.push(task);
    } else {
      grouped.pending.push(task);
    }
  });

  // If no filters selected, return all grouped tasks
  const noFiltersActive = !filters.completed && !filters.pending && !filters.overdue;
  if (noFiltersActive) {
    return grouped;
  }

  // Return only filtered groups
  return {
    completed: filters.completed ? grouped.completed : [],
    pending: filters.pending ? grouped.pending : [],
    overdue: filters.overdue ? grouped.overdue : [],
  };
};

/**
 * Returns color array for dashboard visualization based on active filters
 *
 * @function getDashboardColor
 * @param {FilterOptions} filters - Object specifying which categories are active
 * @returns {string[]} Array of hex color codes for chart rendering
 *
 * @example
 * getDashboardColor({ completed: true, pending: false }); // ['#22c55e']
 * getDashboardColor({ completed: true, pending: true }); // ['#22c55e', '#facc15']
 */
export const getDashboardColor = (filters) => {
  const colors = [];

  if (filters.completed) {
    colors.push(COLORS.SUCCESS);
  }
  if (filters.pending) {
    colors.push(COLORS.WARNING);
  }

  // Default to success color if no filters active
  return colors.length > 0 ? colors : [COLORS.SUCCESS];
};

/**
 * @typedef {Object} MemberFilters
 * @property {boolean} active - Include active members
 * @property {boolean} inactive - Include inactive members
 * @property {boolean} unresponsive - Include unresponsive members
 */

/**
 * Returns color array for member status visualization
 *
 * @function getStatusColors
 * @param {MemberFilters} memberFilters - Object specifying which statuses are active
 * @returns {string[]} Array of hex color codes
 */
export const getStatusColors = (memberFilters) => {
  const colors = [];

  if (memberFilters.active) {
    colors.push(COLORS.SUCCESS);
  }
  if (memberFilters.inactive) {
    colors.push(COLORS.WARNING);
  }
  if (memberFilters.unresponsive) {
    colors.push(COLORS.DANGER);
  }

  return colors.length > 0 ? colors : [COLORS.SUCCESS];
};

/**
 * @typedef {Object} MemberCounts
 * @property {number} active - Count of active members
 * @property {number} inactive - Count of inactive members
 * @property {number} unresponsive - Count of unresponsive members
 */

/**
 * Returns value array for member status chart based on filters
 *
 * @function getStatusValues
 * @param {MemberFilters} memberFilters - Object specifying which statuses are active
 * @param {MemberCounts} counts - Object containing member counts by status
 * @returns {number[]} Array of count values for chart rendering
 */
export const getStatusValues = (memberFilters, counts) => {
  const values = [];

  if (memberFilters.active) {
    values.push(counts.active);
  }
  if (memberFilters.inactive) {
    values.push(counts.inactive);
  }
  if (memberFilters.unresponsive) {
    values.push(counts.unresponsive);
  }

  return values.length > 0 ? values : [counts.active];
};

/**
 * Priority badge configuration lookup table
 * @constant {Object}
 * @private
 */
const PRIORITY_BADGE_CONFIG = Object.freeze({
  [TASK_PRIORITY.HIGH]: {
    label: 'High',
    className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded',
  },
  [TASK_PRIORITY.MEDIUM]: {
    label: 'Medium',
    className: 'px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded',
  },
  [TASK_PRIORITY.LOW]: {
    label: 'Low',
    className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded',
  },
});

/**
 * Returns badge configuration for task priority display
 *
 * @function getPriorityBadge
 * @param {string} priority - Task priority level (low, medium, high)
 * @returns {BadgeConfig} Object containing label and className for badge rendering
 *
 * @example
 * getPriorityBadge('high');
 * // { label: 'High', className: 'px-2 py-1 text-xs bg-red-100 text-red-700 rounded' }
 */
export const getPriorityBadge = (priority) => {
  return PRIORITY_BADGE_CONFIG[priority] || PRIORITY_BADGE_CONFIG[TASK_PRIORITY.LOW];
};

/**
 * Status badge configuration lookup table
 * @constant {Object}
 * @private
 */
const STATUS_BADGE_CONFIG = Object.freeze({
  [TASK_STATUS.COMPLETED]: {
    label: 'Completed',
    className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded',
  },
  [TASK_STATUS.PENDING]: {
    label: 'Pending',
    className: 'px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded',
  },
  [TASK_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    className: 'px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded',
  },
});

/**
 * Returns badge configuration for task status display
 *
 * @function getStatusBadge
 * @param {string} status - Task status (pending, in-progress, completed)
 * @returns {BadgeConfig} Object containing label and className for badge rendering
 *
 * @example
 * getStatusBadge('completed');
 * // { label: 'Completed', className: 'px-2 py-1 text-xs bg-green-100 text-green-700 rounded' }
 */
export const getStatusBadge = (status) => {
  return STATUS_BADGE_CONFIG[status] || STATUS_BADGE_CONFIG[TASK_STATUS.PENDING];
};
