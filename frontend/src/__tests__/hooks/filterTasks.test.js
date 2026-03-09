/**
 * @fileoverview Unit tests for filterTasks utility functions
 * @description Comprehensive tests for task filtering and badge generation utilities
 *
 * METHODS TESTED:
 * - METHOD 2: isOverdue - Date comparison logic for due dates
 * - METHOD 3: filterTasks - General task filtering by criteria
 * - METHOD 4: filterDashboardTasks - Task grouping for dashboard display
 * - METHOD 5: getPriorityBadge - Priority badge configuration generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isOverdue,
  filterTasks,
  filterDashboardTasks,
  getPriorityBadge,
  getStatusBadge,
  formatDate,
} from '../../hooks/filterTasks';
import { TASK_STATUS, TASK_PRIORITY } from '../../utils/constants';

/**
 * METHOD 2: isOverdue
 * Tests the date comparison algorithm for determining if a task is past due
 */
describe('isOverdue', () => {
  beforeEach(() => {
    // Mock system time to December 5, 2025, 12:00 UTC for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-05T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should return true for past dates', () => {
      // Arrange
      const pastDate = '2025-12-01T00:00:00.000Z';

      // Act
      const result = isOverdue(pastDate);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = '2025-12-31T00:00:00.000Z';

      const result = isOverdue(futureDate);

      expect(result).toBe(false);
    });

    it('should return false for null date', () => {
      const result = isOverdue(null);

      expect(result).toBe(false);
    });

    it('should return false for undefined date', () => {
      const result = isOverdue(undefined);

      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Date objects', () => {
      const pastDate = new Date('2025-11-01');

      const result = isOverdue(pastDate);

      expect(result).toBe(true);
    });

    it('should handle ISO date strings', () => {
      const futureDate = '2026-01-01T00:00:00.000Z';

      const result = isOverdue(futureDate);

      expect(result).toBe(false);
    });

    it('should handle dates from yesterday', () => {
      const yesterday = '2025-12-04T23:59:59.000Z';

      const result = isOverdue(yesterday);

      expect(result).toBe(true);
    });

    it('should handle dates from tomorrow', () => {
      const tomorrow = '2025-12-06T00:00:01.000Z';

      const result = isOverdue(tomorrow);

      expect(result).toBe(false);
    });
  });
});

/**
 * METHOD 3: filterTasks
 * Tests the general task filtering algorithm
 * Algorithm: O(n) linear scan with predicate matching
 */
describe('filterTasks', () => {
  const createMockTasks = () => [
    { _id: '1', title: 'Task 1', status: TASK_STATUS.COMPLETED, priority: TASK_PRIORITY.HIGH },
    { _id: '2', title: 'Task 2', status: TASK_STATUS.PENDING, priority: TASK_PRIORITY.MEDIUM },
    { _id: '3', title: 'Task 3', status: TASK_STATUS.PENDING, priority: TASK_PRIORITY.LOW },
    { _id: '4', title: 'Task 4', status: TASK_STATUS.COMPLETED, priority: TASK_PRIORITY.HIGH },
    {
      _id: '5',
      title: 'Task 5',
      status: TASK_STATUS.PENDING,
      priority: TASK_PRIORITY.HIGH,
      dueDate: '2020-01-01',
    },
  ];

  describe('Filter by Status', () => {
    it('should filter completed tasks', () => {
      // Arrange
      const tasks = createMockTasks();

      // Act
      const result = filterTasks(tasks, 'completed');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.status === TASK_STATUS.COMPLETED)).toBe(true);
    });

    it('should filter pending tasks', () => {
      const tasks = createMockTasks();

      const result = filterTasks(tasks, 'pending');

      expect(result).toHaveLength(3);
      expect(result.every((t) => t.status === TASK_STATUS.PENDING)).toBe(true);
    });

    it('should return all tasks with "all" filter', () => {
      const tasks = createMockTasks();

      const result = filterTasks(tasks, 'all');

      expect(result).toHaveLength(5);
      expect(result).toEqual(tasks);
    });
  });

  describe('Filter by Priority', () => {
    it('should filter high priority tasks', () => {
      const tasks = createMockTasks();

      const result = filterTasks(tasks, 'high');

      expect(result).toHaveLength(3);
      expect(result.every((t) => t.priority === TASK_PRIORITY.HIGH)).toBe(true);
    });
  });

  describe('Filter by Overdue', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-12-05T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should filter overdue tasks', () => {
      const tasks = createMockTasks();

      const result = filterTasks(tasks, 'overdue');

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe('5');
    });
  });

  describe('Error Handling', () => {
    it('should return empty array for non-array input', () => {
      const result = filterTasks(null, 'all');

      expect(result).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      const result = filterTasks(undefined, 'all');

      expect(result).toEqual([]);
    });

    it('should return original tasks for unknown filter', () => {
      const tasks = createMockTasks();

      const result = filterTasks(tasks, 'unknownFilter');

      expect(result).toEqual(tasks);
    });

    it('should handle empty tasks array', () => {
      const result = filterTasks([], 'pending');

      expect(result).toEqual([]);
    });
  });
});

/**
 * METHOD 4: filterDashboardTasks
 * Tests the task grouping algorithm for dashboard visualization
 * Algorithm: Single-pass O(n) categorization with conditional filtering
 */
describe('filterDashboardTasks', () => {
  const createMockTasks = () => [
    { _id: '1', status: TASK_STATUS.COMPLETED },
    { _id: '2', status: TASK_STATUS.COMPLETED },
    { _id: '3', status: TASK_STATUS.PENDING },
    { _id: '4', status: TASK_STATUS.PENDING },
    { _id: '5', status: TASK_STATUS.PENDING },
  ];

  describe('Task Grouping', () => {
    it('should group tasks by status when no filters active', () => {
      // Arrange
      const tasks = createMockTasks();
      const filters = { completed: false, pending: false, overdue: false };

      // Act
      const result = filterDashboardTasks(tasks, filters);

      // Assert
      expect(result.completed).toHaveLength(2);
      expect(result.pending).toHaveLength(3);
      expect(result.overdue).toHaveLength(0);
    });

    it('should return only completed when completed filter active', () => {
      const tasks = createMockTasks();
      const filters = { completed: true, pending: false, overdue: false };

      const result = filterDashboardTasks(tasks, filters);

      expect(result.completed).toHaveLength(2);
      expect(result.pending).toHaveLength(0);
      expect(result.overdue).toHaveLength(0);
    });

    it('should return only pending when pending filter active', () => {
      const tasks = createMockTasks();
      const filters = { completed: false, pending: true, overdue: false };

      const result = filterDashboardTasks(tasks, filters);

      expect(result.completed).toHaveLength(0);
      expect(result.pending).toHaveLength(3);
    });

    it('should return multiple groups when multiple filters active', () => {
      const tasks = createMockTasks();
      const filters = { completed: true, pending: true, overdue: false };

      const result = filterDashboardTasks(tasks, filters);

      expect(result.completed).toHaveLength(2);
      expect(result.pending).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tasks array', () => {
      const filters = { completed: true, pending: true, overdue: true };

      const result = filterDashboardTasks([], filters);

      expect(result.completed).toEqual([]);
      expect(result.pending).toEqual([]);
      expect(result.overdue).toEqual([]);
    });

    it('should handle undefined tasks with default', () => {
      const filters = { completed: true, pending: true, overdue: false };

      const result = filterDashboardTasks(undefined, filters);

      expect(result.completed).toEqual([]);
      expect(result.pending).toEqual([]);
    });

    it('should handle all filters false (returns all grouped)', () => {
      const tasks = createMockTasks();
      const filters = { completed: false, pending: false, overdue: false };

      const result = filterDashboardTasks(tasks, filters);

      expect(result.completed.length + result.pending.length).toBe(5);
    });
  });
});

/**
 * METHOD 5: getPriorityBadge
 * Tests the badge configuration generator for task priorities
 * Implements a lookup pattern for O(1) badge retrieval
 */
describe('getPriorityBadge', () => {
  describe('Badge Generation', () => {
    it('should return correct badge for high priority', () => {
      // Arrange & Act
      const badge = getPriorityBadge(TASK_PRIORITY.HIGH);

      // Assert
      expect(badge.label).toBe('High');
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-700');
    });

    it('should return correct badge for medium priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.MEDIUM);

      expect(badge.label).toBe('Medium');
      expect(badge.className).toContain('bg-orange-100');
      expect(badge.className).toContain('text-orange-700');
    });

    it('should return correct badge for low priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.LOW);

      expect(badge.label).toBe('Low');
      expect(badge.className).toContain('bg-blue-100');
      expect(badge.className).toContain('text-blue-700');
    });
  });

  describe('Default Behavior', () => {
    it('should return low badge for undefined priority', () => {
      const badge = getPriorityBadge(undefined);

      expect(badge.label).toBe('Low');
    });

    it('should return low badge for unknown priority', () => {
      const badge = getPriorityBadge('unknown');

      expect(badge.label).toBe('Low');
    });

    it('should return low badge for null priority', () => {
      const badge = getPriorityBadge(null);

      expect(badge.label).toBe('Low');
    });
  });

  describe('Badge Structure', () => {
    it('should return object with label and className properties', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.HIGH);

      expect(badge).toHaveProperty('label');
      expect(badge).toHaveProperty('className');
      expect(typeof badge.label).toBe('string');
      expect(typeof badge.className).toBe('string');
    });

    it('should include common styling classes', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.HIGH);

      expect(badge.className).toContain('px-2');
      expect(badge.className).toContain('py-1');
      expect(badge.className).toContain('text-xs');
      expect(badge.className).toContain('rounded');
    });
  });
});

/**
 * Additional tests for getStatusBadge
 */
describe('getStatusBadge', () => {
  it('should return correct badge for completed status', () => {
    const badge = getStatusBadge(TASK_STATUS.COMPLETED);

    expect(badge.label).toBe('Completed');
    expect(badge.className).toContain('bg-green-100');
  });

  it('should return correct badge for pending status', () => {
    const badge = getStatusBadge(TASK_STATUS.PENDING);

    expect(badge.label).toBe('Pending');
    expect(badge.className).toContain('bg-gray-100');
  });

  it('should return pending badge as default', () => {
    const badge = getStatusBadge('unknown');

    expect(badge.label).toBe('Pending');
  });
});

/**
 * Additional tests for formatDate utility
 */
describe('formatDate', () => {
  it('should return "No due date" for null', () => {
    expect(formatDate(null)).toBe('No due date');
  });

  it('should return "No due date" for undefined', () => {
    expect(formatDate(undefined)).toBe('No due date');
  });

  it('should format valid date string', () => {
    const result = formatDate('2025-12-25');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
});
