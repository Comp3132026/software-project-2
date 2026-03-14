/**
 * @fileoverview Group role computation and permission utilities
 * @module utils/groupRoles
 * @description Computes user roles and permissions within a group context.
 * Implements Role-Based Access Control (RBAC) with hierarchy: Owner > Moderator > Member > Viewer
 */

import { USER_ROLES } from './constants';

/**
 * @typedef {Object} GroupRolesResult
 * @property {string} userRole - The user's role in the group
 * @property {boolean} isOwner - Whether the user is the group owner
 * @property {boolean} isModerator - Whether the user is a moderator
 * @property {boolean} isMember - Whether the user is a regular member
 * @property {boolean} isViewer - Whether the user is a viewer (read-only)
 * @property {boolean} canManageMembers - Permission to add/remove/suspend members
 * @property {boolean} canManageTasks - Permission to create/edit tasks
 * @property {boolean} canDeleteTasks - Permission to delete any task
 * @property {boolean} canEditGroup - Permission to edit group details
 * @property {boolean} canDeleteGroup - Permission to delete the group
 * @property {boolean} canModerateChat - Permission to moderate chat messages
 */

/**
 * Default permissions for unauthenticated or invalid states
 * @constant {GroupRolesResult}
 * @private
 */
const DEFAULT_PERMISSIONS = Object.freeze({
  userRole: USER_ROLES.VIEWER,
  isOwner: false,
  isModerator: false,
  isMember: false,
  isViewer: true,
  canManageMembers: false,
  canManageTasks: false,
  canDeleteTasks: false,
  canEditGroup: false,
  canDeleteGroup: false,
  canModerateChat: false,
});

/**
 * Computes user roles and permissions within a group
 *
 * @function computeGroupRoles
 * @param {Object} group - The group object containing owner information
 * @param {Object} group.owner - The group owner object
 * @param {string} group.owner._id - The owner's user ID
 * @param {Array<Object>} members - Array of group membership objects
 * @param {string} members[].userId - The member's user ID
 * @param {string} members[].role - The member's role in the group
 * @param {Object} user - The current user object
 * @param {string} user._id - The current user's ID
 * @returns {GroupRolesResult} Object containing role flags and permission booleans
 *
 * @example
 * const roles = computeGroupRoles(group, members, currentUser);
 * if (roles.canEditGroup) {
 *   // Show edit button
 * }
 *
 * @description
 * Permission Matrix:
 * | Permission       | Owner | Moderator | Member | Viewer |
 * |------------------|-------|-----------|--------|--------|
 * | Manage Members   | ✓     | ✓         | ✗      | ✗      |
 * | Manage Tasks     | ✓     | ✓         | ✓      | ✗      |
 * | Delete Tasks     | ✓     | ✓         | ✗      | ✗      |
 * | Edit Group       | ✓     | ✗         | ✗      | ✗      |
 * | Delete Group     | ✓     | ✗         | ✗      | ✗      |
 * | Moderate Chat    | ✓     | ✓         | ✗      | ✗      |
 *
 * Algorithm Complexity: O(n) where n is number of members (single array scan)
 */
export function computeGroupRoles(group, members, user) {
  // Return default permissions if any required parameter is missing
  if (!group || !members || !user) {
    return { ...DEFAULT_PERMISSIONS };
  }

  // Find the user's membership record - O(n) linear search
  const userMember = members.find((member) => member.userId === user._id);

  // Determine role - owner takes precedence over membership role
  const isGroupOwner = group.owner?._id === user._id;
  const userRole = isGroupOwner ? USER_ROLES.OWNER : userMember?.role || USER_ROLES.VIEWER;

  // Compute role flags using constants for comparison
  const isOwner = userRole === USER_ROLES.OWNER;
  const isModerator = userRole === USER_ROLES.MODERATOR;
  const isMember = userRole === USER_ROLES.MEMBER;
  const isViewer = userRole === USER_ROLES.VIEWER;

  // Compute permissions based on role hierarchy
  // Moderator inherits most owner permissions except group management
  const canManageMembers = isOwner || isModerator;
  const canManageTasks = isOwner || isModerator || isMember;
  const canDeleteTasks = isOwner || isModerator;
  const canEditGroup = isOwner;
  const canDeleteGroup = isOwner;
  const canModerateChat = isOwner || isModerator;

  return {
    userRole,
    isOwner,
    isModerator,
    isMember,
    isViewer,
    canManageMembers,
    canManageTasks,
    canDeleteTasks,
    canEditGroup,
    canDeleteGroup,
    canModerateChat,
  };
}
