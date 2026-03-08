/**
 * @fileoverview Unit tests for frontend utility functions
 * @description Tests for 5 frontend methods: computeGroupRoles, isOverdue,
 * filterTasks, getPriorityBadge, getStatusBadge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeGroupRoles } from '../../utils/groupRoles';
import { isOverdue, filterTasks, getPriorityBadge, getStatusBadge } from '../../hooks/filterTasks';
import { USER_ROLES, TASK_STATUS, TASK_PRIORITY } from '../../utils/constants';

// ============================================================================
// FRONTEND METHOD 1: computeGroupRoles
// ============================================================================
describe('FRONTEND METHOD 1: computeGroupRoles', () => {
  const createMockUser = (id = 'user123') => ({ _id: id });
  const createMockGroup = (ownerId = 'user123') => ({
    _id: 'group123',
    name: 'Test Group',
    owner: { _id: ownerId },
  });
  const createMockMembers = () => [
    { userId: 'user123', role: USER_ROLES.OWNER },
    { userId: 'user456', role: USER_ROLES.MODERATOR },
    { userId: 'user789', role: USER_ROLES.MEMBER },
    { userId: 'user101', role: USER_ROLES.VIEWER },
  ];

  describe('Owner Role Permissions', () => {
    it('should grant all permissions to group owner', () => {
      const user = createMockUser('user123');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.userRole).toBe(USER_ROLES.OWNER);
      expect(roles.isOwner).toBe(true);
      expect(roles.canManageMembers).toBe(true);
      expect(roles.canManageTasks).toBe(true);
      expect(roles.canDeleteTasks).toBe(true);
      expect(roles.canEditGroup).toBe(true);
      expect(roles.canDeleteGroup).toBe(true);
      expect(roles.canModerateChat).toBe(true);
    });

    it('should set other role flags to false for owner', () => {
      const user = createMockUser('user123');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.isModerator).toBe(false);
      expect(roles.isMember).toBe(false);
      expect(roles.isViewer).toBe(false);
    });
  });

  describe('Moderator Role Permissions', () => {
    it('should grant limited permissions to moderator', () => {
      const user = createMockUser('user456');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.userRole).toBe(USER_ROLES.MODERATOR);
      expect(roles.isModerator).toBe(true);
      expect(roles.canManageMembers).toBe(true);
      expect(roles.canModerateChat).toBe(true);
    });

    it('should deny group edit/delete permissions to moderator', () => {
      const user = createMockUser('user456');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.canEditGroup).toBe(false);
      expect(roles.canDeleteGroup).toBe(false);
    });
  });

  describe('Member Role Permissions', () => {
    it('should grant task management only to member', () => {
      const user = createMockUser('user789');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.userRole).toBe(USER_ROLES.MEMBER);
      expect(roles.isMember).toBe(true);
      expect(roles.canManageTasks).toBe(true);
    });

    it('should deny admin permissions to member', () => {
      const user = createMockUser('user789');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.canManageMembers).toBe(false);
      expect(roles.canDeleteTasks).toBe(false);
      expect(roles.canEditGroup).toBe(false);
      expect(roles.canModerateChat).toBe(false);
    });
  });

  describe('Viewer Role Permissions', () => {
    it('should deny all permissions to viewer', () => {
      const user = createMockUser('user101');
      const group = createMockGroup('user123');
      const members = createMockMembers();

      const roles = computeGroupRoles(group, members, user);

      expect(roles.userRole).toBe(USER_ROLES.VIEWER);
      expect(roles.isViewer).toBe(true);
      expect(roles.canManageMembers).toBe(false);
      expect(roles.canManageTasks).toBe(false);
      expect(roles.canDeleteTasks).toBe(false);
      expect(roles.canEditGroup).toBe(false);
      expect(roles.canModerateChat).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should return viewer defaults when group is null', () => {
      const user = createMockUser();
      const members = createMockMembers();
      const roles = computeGroupRoles(null, members, user);
      expect(roles.userRole).toBe(USER_ROLES.VIEWER);
    });

    it('should return viewer defaults when members is null', () => {
      const user = createMockUser();
      const group = createMockGroup();
      const roles = computeGroupRoles(group, null, user);
      expect(roles.userRole).toBe(USER_ROLES.VIEWER);
    });

    it('should return viewer defaults when user is null', () => {
      const group = createMockGroup();
      const members = createMockMembers();
      const roles = computeGroupRoles(group, members, null);
      expect(roles.userRole).toBe(USER_ROLES.VIEWER);
    });

    it('should return viewer role for user not in members list', () => {
      const user = createMockUser('unknownUser');
      const group = createMockGroup('user123');
      const members = createMockMembers();
      const roles = computeGroupRoles(group, members, user);
      expect(roles.userRole).toBe(USER_ROLES.VIEWER);
    });
  });
});

// ============================================================================
// FRONTEND METHOD 2: isOverdue
// ============================================================================
describe('FRONTEND METHOD 2: isOverdue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-12-05T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should return true for past dates', () => {
      expect(isOverdue('2025-12-01T00:00:00.000Z')).toBe(true);
    });

    it('should return false for future dates', () => {
      expect(isOverdue('2025-12-31T00:00:00.000Z')).toBe(false);
    });

    it('should return false for null date', () => {
      expect(isOverdue(null)).toBe(false);
    });

    it('should return false for undefined date', () => {
      expect(isOverdue(undefined)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle Date objects', () => {
      expect(isOverdue(new Date('2025-11-01'))).toBe(true);
    });

    it('should handle ISO date strings', () => {
      expect(isOverdue('2026-01-01T00:00:00.000Z')).toBe(false);
    });

    it('should return true for yesterday', () => {
      expect(isOverdue('2025-12-04T23:59:59.000Z')).toBe(true);
    });

    it('should return false for tomorrow', () => {
      expect(isOverdue('2025-12-06T00:00:01.000Z')).toBe(false);
    });
  });
});

// ============================================================================
// FRONTEND METHOD 3: filterTasks
// ============================================================================
describe('FRONTEND METHOD 3: filterTasks', () => {
  const mockTasks = [
    {
      _id: '1',
      status: TASK_STATUS.COMPLETED,
      priority: TASK_PRIORITY.HIGH,
      dueDate: '2025-12-01',
    },
    { _id: '2', status: TASK_STATUS.PENDING, priority: TASK_PRIORITY.LOW, dueDate: '2025-12-31' },
    { _id: '3', status: TASK_STATUS.PENDING, priority: TASK_PRIORITY.HIGH, dueDate: '2025-12-10' },
    { _id: '4', status: TASK_STATUS.COMPLETED, priority: TASK_PRIORITY.MEDIUM, dueDate: null },
  ];

  describe('Filter by Status', () => {
    it('should return all tasks for "all" filter', () => {
      const result = filterTasks(mockTasks, 'all');
      expect(result).toHaveLength(4);
    });

    it('should filter completed tasks', () => {
      const result = filterTasks(mockTasks, 'completed');
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.status === TASK_STATUS.COMPLETED)).toBe(true);
    });

    it('should filter pending tasks', () => {
      const result = filterTasks(mockTasks, 'pending');
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.status === TASK_STATUS.PENDING)).toBe(true);
    });
  });

  describe('Filter by Priority', () => {
    it('should filter high priority tasks', () => {
      const result = filterTasks(mockTasks, 'high');
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.priority === TASK_PRIORITY.HIGH)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return empty array for null input', () => {
      expect(filterTasks(null, 'all')).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(filterTasks(undefined, 'all')).toEqual([]);
    });

    it('should return all tasks for unknown filter', () => {
      expect(filterTasks(mockTasks, 'unknown')).toHaveLength(4);
    });

    it('should return empty array for non-array input', () => {
      expect(filterTasks('not an array', 'all')).toEqual([]);
    });
  });
});

// ============================================================================
// FRONTEND METHOD 4: getPriorityBadge
// ============================================================================
describe('FRONTEND METHOD 4: getPriorityBadge', () => {
  describe('Badge Labels', () => {
    it('should return "High" label for high priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.HIGH);
      expect(badge.label).toBe('High');
    });

    it('should return "Medium" label for medium priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.MEDIUM);
      expect(badge.label).toBe('Medium');
    });

    it('should return "Low" label for low priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.LOW);
      expect(badge.label).toBe('Low');
    });
  });

  describe('Badge Styling', () => {
    it('should return red styling for high priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.HIGH);
      expect(badge.className).toContain('bg-red-100');
      expect(badge.className).toContain('text-red-700');
    });

    it('should return orange styling for medium priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.MEDIUM);
      expect(badge.className).toContain('bg-orange-100');
    });

    it('should return blue styling for low priority', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.LOW);
      expect(badge.className).toContain('bg-blue-100');
    });
  });

  describe('Default Behavior', () => {
    it('should return low badge for undefined priority', () => {
      expect(getPriorityBadge(undefined).label).toBe('Low');
    });

    it('should return low badge for null priority', () => {
      expect(getPriorityBadge(null).label).toBe('Low');
    });

    it('should return low badge for unknown priority', () => {
      expect(getPriorityBadge('unknown').label).toBe('Low');
    });
  });

  describe('Badge Structure', () => {
    it('should have label and className properties', () => {
      const badge = getPriorityBadge(TASK_PRIORITY.HIGH);
      expect(badge).toHaveProperty('label');
      expect(badge).toHaveProperty('className');
    });
  });
});

// ============================================================================
// FRONTEND METHOD 5: getStatusBadge
// ============================================================================
describe('FRONTEND METHOD 5: getStatusBadge', () => {
  describe('Badge Labels', () => {
    it('should return "Completed" label for completed status', () => {
      const badge = getStatusBadge(TASK_STATUS.COMPLETED);
      expect(badge.label).toBe('Completed');
    });

    it('should return "Pending" label for pending status', () => {
      const badge = getStatusBadge(TASK_STATUS.PENDING);
      expect(badge.label).toBe('Pending');
    });

    it('should return "In Progress" label for in-progress status', () => {
      const badge = getStatusBadge(TASK_STATUS.IN_PROGRESS);
      expect(badge.label).toBe('In Progress');
    });
  });

  describe('Badge Styling', () => {
    it('should return green styling for completed status', () => {
      const badge = getStatusBadge(TASK_STATUS.COMPLETED);
      expect(badge.className).toContain('bg-green-100');
      expect(badge.className).toContain('text-green-700');
    });

    it('should return gray styling for pending status', () => {
      const badge = getStatusBadge(TASK_STATUS.PENDING);
      expect(badge.className).toContain('bg-gray-100');
    });

    it('should return blue styling for in-progress status', () => {
      const badge = getStatusBadge(TASK_STATUS.IN_PROGRESS);
      expect(badge.className).toContain('bg-blue-100');
    });
  });

  describe('Default Behavior', () => {
    it('should return pending badge for undefined status', () => {
      expect(getStatusBadge(undefined).label).toBe('Pending');
    });

    it('should return pending badge for null status', () => {
      expect(getStatusBadge(null).label).toBe('Pending');
    });

    it('should return pending badge for unknown status', () => {
      expect(getStatusBadge('unknown').label).toBe('Pending');
    });
  });

  describe('Badge Structure', () => {
    it('should have label and className properties', () => {
      const badge = getStatusBadge(TASK_STATUS.COMPLETED);
      expect(badge).toHaveProperty('label');
      expect(badge).toHaveProperty('className');
    });
  });
});
