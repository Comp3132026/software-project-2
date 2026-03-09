# LifeSync Unit Testing Documentation

## Overview

This document outlines the unit testing implementation for **10 methods** in the LifeSync application: **5 backend** and **5 frontend**.

**Total: 117 tests across 2 test files**

| Location | Test File | Methods | Tests |
|----------|-----------|---------|-------|
| Backend | `__tests__/helpers.test.js` | 5 | 70 |
| Frontend | `__tests__/utils/frontend.test.js` | 5 | 47 |
| **Total** | | **10** | **117** |

---

## Running Tests

### Backend Tests (Jest)

```bash
cd backend

# Install dependencies
npm install

# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

**Expected Output:**
```
PASS __tests__/helpers.test.js
  BACKEND METHOD 1: validateEmail (14 tests)
  BACKEND METHOD 2: validatePassword (9 tests)
  BACKEND METHOD 3: checkPermission (21 tests)
  BACKEND METHOD 4: sanitizeInput (14 tests)
  BACKEND METHOD 5: calculateTaskStats (12 tests)

Test Suites: 1 passed, 1 total
Tests:       70 passed, 70 total
```

### Frontend Tests (Vitest)

```bash
cd frontend

# Install dependencies
npm install

# Run tests once
npm run test:run

# Run tests in watch mode
npm test

# Run with coverage
npm run test:coverage
```

**Expected Output:**
```
✓ src/__tests__/utils/frontend.test.js (47 tests)

Test Files  1 passed (1)
     Tests  47 passed (47)
```

---

## Backend Methods (5)

---

### BACKEND METHOD 1: `validateEmail()`

**Source File:** `backend/utils/helpers.js`  
**Test File:** `backend/__tests__/helpers.test.js`  
**Tests:** 14

#### Purpose
Validates an email address format using regex pattern matching.

#### Function Signature
```javascript
function validateEmail(email) → {boolean}
```

#### Test Cases
| Category | Test | Expected |
|----------|------|----------|
| Valid | Standard format (user@example.com) | true |
| Valid | With subdomain | true |
| Valid | With plus sign | true |
| Valid | With numbers | true |
| Valid | With dots in local part | true |
| Valid | With whitespace (trimmed) | true |
| Invalid | Without @ | false |
| Invalid | Without domain | false |
| Invalid | Without local part | false |
| Invalid | With spaces in middle | false |
| Invalid | Empty string | false |
| Invalid | Null | false |
| Invalid | Undefined | false |
| Invalid | Number | false |

---

### BACKEND METHOD 2: `validatePassword()`

**Source File:** `backend/utils/helpers.js`  
**Test File:** `backend/__tests__/helpers.test.js`  
**Tests:** 9

#### Purpose
Validates password meets minimum requirements with customizable length.

#### Function Signature
```javascript
function validatePassword(password, minLength = 6) → {{ valid: boolean, message: string }}
```

#### Test Cases
| Category | Test | Expected |
|----------|------|----------|
| Valid | Exactly 6 characters | { valid: true } |
| Valid | More than 6 characters | { valid: true } |
| Valid | With special characters | { valid: true } |
| Valid | Custom min length (8) | { valid: true } |
| Invalid | Less than 6 characters | { valid: false } |
| Invalid | Empty string | { valid: false, message: 'Password is required' } |
| Invalid | Null | { valid: false } |
| Invalid | Undefined | { valid: false } |
| Invalid | Fails custom min length | { valid: false } |

---

### BACKEND METHOD 3: `checkPermission()`

**Source File:** `backend/utils/helpers.js`  
**Test File:** `backend/__tests__/helpers.test.js`  
**Tests:** 21

#### Purpose
Checks if a user role has permission for an action based on role hierarchy.

#### Role Hierarchy
```
owner (4) > moderator (3) > member (2) > viewer (1)
```

#### Function Signature
```javascript
function checkPermission(userRole, requiredRole) → {boolean}
```

#### Test Cases
| User Role | Required Role | Expected |
|-----------|--------------|----------|
| owner | owner | true |
| owner | moderator | true |
| owner | member | true |
| owner | viewer | true |
| moderator | owner | false |
| moderator | moderator | true |
| moderator | member | true |
| moderator | viewer | true |
| member | owner | false |
| member | moderator | false |
| member | member | true |
| member | viewer | true |
| viewer | owner | false |
| viewer | moderator | false |
| viewer | member | false |
| viewer | viewer | true |
| null | member | false |
| owner | null | false |
| invalid | member | false |
| owner | invalid | false |
| OWNER (case) | moderator | true |

---

### BACKEND METHOD 4: `sanitizeInput()`

**Source File:** `backend/utils/helpers.js`  
**Test File:** `backend/__tests__/helpers.test.js`  
**Tests:** 14

#### Purpose
Sanitizes user input by trimming whitespace and removing dangerous characters.

#### Function Signature
```javascript
function sanitizeInput(input) → {string}
```

#### Test Cases
| Category | Input | Expected |
|----------|-------|----------|
| Whitespace | "  hello" | "hello" |
| Whitespace | "hello  " | "hello" |
| Whitespace | "  hello  " | "hello" |
| Whitespace | "hello    world" | "hello world" |
| Whitespace | "hello\t\nworld" | "hello world" |
| Security | "hello<world" | "helloworld" |
| Security | "hello>world" | "helloworld" |
| Security | "\<script\>alert\</script\>" | No angle brackets |
| Security | "<<hello>>" | "hello" |
| Edge | null | "" |
| Edge | undefined | "" |
| Edge | 12345 (number) | "" |
| Edge | "" | "" |
| Edge | "hello world" | "hello world" |

---

### BACKEND METHOD 5: `calculateTaskStats()`

**Source File:** `backend/utils/helpers.js`  
**Test File:** `backend/__tests__/helpers.test.js`  
**Tests:** 12

#### Purpose
Calculates task statistics from an array of tasks.

#### Function Signature
```javascript
function calculateTaskStats(tasks) → {{ total, completed, pending, inProgress, completionRate }}
```

#### Test Cases
| Category | Input | Expected Stats |
|----------|-------|----------------|
| Mixed | 2 completed, 1 pending, 1 in-progress | { total: 4, completionRate: 50 } |
| Complete | 3 completed | { completionRate: 100 } |
| None complete | 2 pending | { completionRate: 0 } |
| Rounding | 1/3 completed | { completionRate: 33 } |
| Single status | All completed | { completed: 2 } |
| Single status | All pending | { pending: 2 } |
| Single status | All in-progress | { inProgress: 2 } |
| Edge | Empty array | { total: 0, completionRate: 0 } |
| Edge | Null | Default stats |
| Edge | Undefined | Default stats |
| Edge | Non-array | Default stats |
| Edge | Unknown status | Counts total, ignores unknown |

---

## Frontend Methods (5)

---

### FRONTEND METHOD 1: `computeGroupRoles()`

**Source File:** `frontend/src/utils/groupRoles.js`  
**Test File:** `frontend/src/__tests__/utils/frontend.test.js`  
**Tests:** 12

#### Purpose
Computes user roles and permissions within a group using RBAC.

#### Function Signature
```javascript
function computeGroupRoles(group, members, user) → {Object}
```

#### Returns
```javascript
{
  userRole: 'owner' | 'moderator' | 'member' | 'viewer',
  isOwner, isModerator, isMember, isViewer: boolean,
  canManageMembers, canManageTasks, canDeleteTasks,
  canEditGroup, canDeleteGroup, canModerateChat: boolean
}
```

#### Test Cases
| Role | Permissions Tested |
|------|-------------------|
| Owner | All permissions = true |
| Owner | Other role flags = false |
| Moderator | canManageMembers, canModerateChat = true |
| Moderator | canEditGroup, canDeleteGroup = false |
| Member | canManageTasks = true |
| Member | Admin permissions = false |
| Viewer | All permissions = false |
| Edge | Null group → viewer defaults |
| Edge | Null members → viewer defaults |
| Edge | Null user → viewer defaults |
| Edge | User not in group → viewer |

---

### FRONTEND METHOD 2: `isOverdue()`

**Source File:** `frontend/src/hooks/filterTasks.js`  
**Test File:** `frontend/src/__tests__/utils/frontend.test.js`  
**Tests:** 8

#### Purpose
Determines if a task is past its due date.

#### Function Signature
```javascript
function isOverdue(dueDate) → {boolean}
```

**Time Complexity:** O(1)

#### Test Cases
| Input | Expected |
|-------|----------|
| Past date string | true |
| Future date string | false |
| Null | false |
| Undefined | false |
| Date object (past) | true |
| ISO string (future) | false |
| Yesterday | true |
| Tomorrow | false |

---

### FRONTEND METHOD 3: `filterTasks()`

**Source File:** `frontend/src/hooks/filterTasks.js`  
**Test File:** `frontend/src/__tests__/utils/frontend.test.js`  
**Tests:** 8

#### Purpose
Filters an array of tasks based on specified criteria.

#### Function Signature
```javascript
function filterTasks(tasks, filter) → {Array}
```

**Time Complexity:** O(n)

#### Test Cases
| Filter | Expected |
|--------|----------|
| 'all' | All tasks |
| 'completed' | Only completed |
| 'pending' | Only pending |
| 'high' | Only high priority |
| null input | Empty array |
| undefined input | Empty array |
| 'unknown' filter | All tasks |
| Non-array input | Empty array |

---

### FRONTEND METHOD 4: `getPriorityBadge()`

**Source File:** `frontend/src/hooks/filterTasks.js`  
**Test File:** `frontend/src/__tests__/utils/frontend.test.js`  
**Tests:** 10

#### Purpose
Returns badge configuration for task priority display.

#### Function Signature
```javascript
function getPriorityBadge(priority) → {{ label: string, className: string }}
```

**Time Complexity:** O(1) - lookup table

#### Test Cases
| Priority | Label | Style Contains |
|----------|-------|----------------|
| 'high' | 'High' | bg-red-100, text-red-700 |
| 'medium' | 'Medium' | bg-orange-100 |
| 'low' | 'Low' | bg-blue-100 |
| undefined | 'Low' | default |
| null | 'Low' | default |
| 'unknown' | 'Low' | default |
| any | - | has label property |
| any | - | has className property |

---

### FRONTEND METHOD 5: `getStatusBadge()`

**Source File:** `frontend/src/hooks/filterTasks.js`  
**Test File:** `frontend/src/__tests__/utils/frontend.test.js`  
**Tests:** 10

#### Purpose
Returns badge configuration for task status display.

#### Function Signature
```javascript
function getStatusBadge(status) → {{ label: string, className: string }}
```

**Time Complexity:** O(1) - lookup table

#### Test Cases
| Status | Label | Style Contains |
|--------|-------|----------------|
| 'completed' | 'Completed' | bg-green-100, text-green-700 |
| 'pending' | 'Pending' | bg-gray-100 |
| 'in-progress' | 'In Progress' | bg-blue-100 |
| undefined | 'Pending' | default |
| null | 'Pending' | default |
| 'unknown' | 'Pending' | default |
| any | - | has label property |
| any | - | has className property |

---

## Test Structure

```
lifesync/
├── backend/
│   ├── __tests__/
│   │   └── helpers.test.js      # 5 backend methods (70 tests)
│   ├── utils/
│   │   └── helpers.js           # Backend utility functions
│   └── package.json             # Jest configuration
│
└── frontend/
    ├── src/
    │   ├── __tests__/
    │   │   └── utils/
    │   │       └── frontend.test.js  # 5 frontend methods (47 tests)
    │   ├── hooks/
    │   │   └── filterTasks.js   # Frontend methods 2-5
    │   └── utils/
    │       └── groupRoles.js    # Frontend method 1
    └── package.json             # Vitest configuration
```

---

## Summary

| # | Method | Location | Tests | Purpose |
|---|--------|----------|-------|---------|
| 1 | `validateEmail()` | Backend | 14 | Email format validation |
| 2 | `validatePassword()` | Backend | 9 | Password validation |
| 3 | `checkPermission()` | Backend | 21 | Role-based permission check |
| 4 | `sanitizeInput()` | Backend | 14 | Input sanitization |
| 5 | `calculateTaskStats()` | Backend | 12 | Task statistics calculation |
| 6 | `computeGroupRoles()` | Frontend | 12 | RBAC permission computation |
| 7 | `isOverdue()` | Frontend | 8 | Due date comparison |
| 8 | `filterTasks()` | Frontend | 8 | Task array filtering |
| 9 | `getPriorityBadge()` | Frontend | 10 | Priority badge config |
| 10 | `getStatusBadge()` | Frontend | 10 | Status badge config |
| | **TOTAL** | | **117** | |



---

## Functional API Testing

### GS6.d: Functional Testing for `getGroup` API Endpoint

**Feature Tested:** `GET /api/groups/:groupId`

**Related Issue:** `GS6.a` / `GS6.d`

#### Purpose
Verify that the API endpoint correctly retrieves all necessary group data for a specific group, including owner, members, and task summary fields, while enforcing authentication and group membership access.

#### Preconditions
- Backend server is running
- MongoDB connection is active
- A user is registered successfully
- A valid JWT token is available
- A group has already been created by the authenticated user

#### Test Setup
A test user was registered using:

```http
POST /api/auth/register