# ✅ Tasks Endpoints (`/api/tasks`)

**File:** `backend/routes/tasks.js`  
**Total Endpoints:** 6  
**Protected:** 6 (all protected 🔒)

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | 🔒 | Create task |
| GET | `/group/:groupId` | 🔒 | Get group tasks (with filters) |
| GET | `/my-tasks` | 🔒 | Get tasks assigned to user |
| GET | `/:taskId` | 🔒 | Get single task |
| PUT | `/:taskId` | 🔒 | Update task |
| PUT | `/:taskId/assign` | 🔒 | Assign task to member |

---

## Data Types

**Task Status:** `pending`, `in-progress`, `completed`  
**Task Priority:** `low`, `medium`, `high`  
**Frequency:** `daily`, `weekly`, `monthly`, `once`

---

## Detailed Endpoints

### 1. Create Task

```http
POST /api/tasks
Authorization: Bearer <TOKEN>
```

**Description:** Create a new task in a group

**Request Body:**
```json
{
  "groupId": "groupId123",
  "title": "Complete project proposal",
  "description": "Prepare and submit Q1 project proposal",
  "priority": "high",
  "dueDate": "2025-02-28",
  "isHabit": false,
  "frequency": "once"
}
```

**Validation Rules:**
- `groupId`: required, must exist
- `title`: 2-200 characters
- `description`: max 1000 characters (optional)
- `priority`: `low`, `medium`, `high` (optional, default: `medium`)
- `frequency`: `daily`, `weekly`, `monthly`, `once` (optional, default: `once`)
- `isHabit`: boolean (optional, default: `false`)

**Success Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "_id": "taskId123",
    "title": "Complete project proposal",
    "description": "Prepare and submit Q1 project proposal",
    "group": "groupId123",
    "status": "pending",
    "priority": "high",
    "dueDate": "2025-02-28T00:00:00Z",
    "assignedTo": [],
    "createdBy": {
      "_id": "userId",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "isHabit": false,
    "frequency": "once",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Error Cases:**
- `400` - Group ID required or invalid input
- `403` - User not a member of this group
- `404` - Group not found

---

### 2. Get Group Tasks

```http
GET /api/tasks/group/:groupId?filters
Authorization: Bearer <TOKEN>
```

**Description:** Get all tasks in a group with optional filtering

**URL Parameters:**
- `groupId` - ID of the group

**Query Parameters:**
- `status` - Filter by status: `pending`, `in-progress`, `completed`
- `priority` - Filter by priority: `low`, `medium`, `high`
- `assignedTo` - Filter by assigned user ID
- `isHabit` - Filter by habit status: `true`, `false`
- `sortBy` - Sort field (default: `createdAt`)
- `sortOrder` - `asc` or `desc` (default: `desc`)

**Examples:**
```
GET /api/tasks/group/groupId123?status=pending
GET /api/tasks/group/groupId123?priority=high&assignedTo=userId
GET /api/tasks/group/groupId123?isHabit=true&sortOrder=asc
```

**Success Response (200):**
```json
[
  {
    "_id": "taskId1",
    "title": "Complete project proposal",
    "description": "Prepare and submit proposal",
    "group": "groupId123",
    "status": "pending",
    "priority": "high",
    "dueDate": "2025-02-28T00:00:00Z",
    "assignedTo": [
      {
        "_id": "userId1",
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    ],
    "createdBy": {...},
    "isHabit": false,
    "frequency": "once",
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

**Error Cases:**
- `403` - User not a member of this group
- `404` - Group not found

---

### 3. Get My Tasks

```http
GET /api/tasks/my-tasks?filters
Authorization: Bearer <TOKEN>
```

**Description:** Get all tasks assigned to the current user

**Query Parameters:**
- `status` - Filter by status
- `priority` - Filter by priority
- `isHabit` - Filter by habit status
- `sortBy` - Sort field (default: `dueDate`)
- `sortOrder` - `asc` or `desc` (default: `desc`)

**Success Response (200):**
```json
[
  {
    "_id": "taskId1",
    "title": "Complete project proposal",
    "group": {
      "_id": "groupId123",
      "name": "Marketing Team",
      "category": "Productivity"
    },
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2025-02-28T00:00:00Z",
    "assignedTo": [...],
    "createdBy": {...},
    "createdAt": "2025-01-15T10:30:00Z"
  }
]
```

**Notes:**
- Tasks sorted by due date ascending (nearest due first)
- All assigned tasks returned regardless of group

---

### 4. Get Single Task

```http
GET /api/tasks/:taskId
Authorization: Bearer <TOKEN>
```

**Description:** Get detailed information about a specific task

**URL Parameters:**
- `taskId` - ID of the task

**Success Response (200):**
```json
{
  "_id": "taskId123",
  "title": "Complete project proposal",
  "description": "Prepare and submit Q1 project proposal",
  "group": {
    "_id": "groupId123",
    "name": "Marketing Team",
    "category": "Productivity",
    "owner": {...},
    "members": [...]
  },
  "status": "pending",
  "priority": "high",
  "dueDate": "2025-02-28T00:00:00Z",
  "assignedTo": [
    {
      "_id": "userId1",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  ],
  "createdBy": {
    "_id": "userId",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "isHabit": false,
  "frequency": "once",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-16T14:22:00Z"
}
```

**Error Cases:**
- `403` - User not a member of the group containing this task
- `404` - Task not found

---

### 5. Update Task

```http
PUT /api/tasks/:taskId
Authorization: Bearer <TOKEN>
```

**Description:** Update task details

**URL Parameters:**
- `taskId` - ID of the task

**Request Body (all optional):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "high",
  "status": "in-progress",
  "dueDate": "2025-03-15",
  "isHabit": false,
  "frequency": "daily",
  "assignedTo": ["userId1", "userId2"]
}
```

**Success Response (200):**
```json
{
  "message": "Task updated successfully",
  "task": {
    "_id": "taskId123",
    "title": "Updated title",
    "description": "Updated description",
    "status": "in-progress",
    "priority": "high",
    "dueDate": "2025-03-15T00:00:00Z",
    "assignedTo": [...],
    "createdBy": {...},
    "updatedAt": "2025-01-16T14:22:00Z"
  }
}
```

**Error Cases:**
- `403` - User not a member of the group
- `404` - Task or group not found

---

### 6. Assign Task to Member

```http
PUT /api/tasks/:taskId/assign
Authorization: Bearer <TOKEN>
```

**Description:** Assign task to a group member (owner only)

**URL Parameters:**
- `taskId` - ID of the task

**Request Body:**
```json
{
  "memberId": "userId123"
}
```

**Success Response (200):**
```json
{
  "message": "Task assigned successfully",
  "task": {
    "_id": "taskId123",
    "title": "Complete project proposal",
    "assignedTo": [
      {
        "_id": "userId123",
        "name": "Jane Doe",
        "email": "jane@example.com"
      }
    ],
    "createdBy": {...}
  }
}
```

**Error Cases:**
- `400` - memberId required or member not in group
- `403` - Only owner can assign tasks
- `404` - Task not found

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Create task
tasksAPI.create({
  groupId: "groupId123",
  title: "Complete project",
  description: "...",
  priority: "high",
  dueDate: "2025-02-28"
})

// Get group tasks with filters
tasksAPI.getByGroup(groupId, {
  status: "pending",
  priority: "high"
})

// Get my tasks
tasksAPI.getMyTasks({
  status: "in-progress"
})

// Get single task
tasksAPI.getOne(taskId)

// Update task
tasksAPI.update(taskId, {
  status: "completed",
  priority: "low"
})

// Assign task
tasksAPI.assign(taskId, {
  memberId: "userId123"
})

// Delete task
tasksAPI.delete(taskId)
```

---

## Filter Examples

### Get pending high-priority tasks
```bash
GET /api/tasks/group/groupId123?status=pending&priority=high
```

### Get all tasks assigned to specific user
```bash
GET /api/tasks/group/groupId123?assignedTo=userId123
```

### Get all daily habits
```bash
GET /api/tasks/my-tasks?isHabit=true&frequency=daily
```

---

## Related Endpoints

- **Create Group:** See [Groups Endpoints](./groups.md)
- **Add Members:** See [Members Endpoints](./members.md)
- **Set Reminder:** See [Notifications Endpoints](./notifications.md)

---

## Related Files

- **Route File:** `backend/routes/tasks.js`
- **Task Model:** `backend/models/Task.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Filtering Hook:** `frontend/src/hooks/filterTasks.js`

---

[← Back to Endpoints Index](./README.md)
