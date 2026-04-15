# 🎯 Groups Endpoints (`/api/groups`)

**File:** `backend/routes/groups.js`  
**Total Endpoints:** 5  
**Protected:** 5 (all protected 🔒)

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | 🔒 | Create new group |
| GET | `/` | 🔒 | Get all user's groups |
| GET | `/:groupId` | 🔒 | Get group details |
| PUT | `/:groupId` | 🔒 | Update group (owner only) |
| DELETE | `/:groupId` | 🔒 | Delete group (owner only) |

---

## Detailed Endpoints

### 1. Create Group

```http
POST /api/groups
Authorization: Bearer <TOKEN>
```

**Description:** Create a new group

**Request Body:**
```json
{
  "name": "Marketing Team",
  "description": "Q1 marketing initiatives",
  "category": "Productivity"
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `description`: max 500 characters (optional)
- `category`: one of `Health`, `Fitness`, `Productivity`, `Learning`, `Finance`, `Social`, `Other`

**Valid Categories:**
```
"Health"
"Fitness"
"Productivity"
"Learning"
"Finance"
"Social"
"Other"
```

**Success Response (201):**
```json
{
  "message": "Group created successfully",
  "group": {
    "_id": "groupId123",
    "name": "Marketing Team",
    "description": "Q1 marketing initiatives",
    "category": "Productivity",
    "owner": {
      "_id": "ownerId",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [
      {
        "user": {
          "_id": "ownerId",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "role": "owner",
        "joinedAt": "2025-01-15T10:30:00Z"
      }
    ],
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

**Error Cases:**
- `400` - Invalid category or validation error

---

### 2. Get All User Groups

```http
GET /api/groups
Authorization: Bearer <TOKEN>
```

**Description:** Get all groups user owns or is a member of

**Success Response (200):**
```json
[
  {
    "_id": "groupId1",
    "name": "Marketing Team",
    "description": "Q1 marketing initiatives",
    "category": "Productivity",
    "owner": {
      "_id": "ownerId",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "members": [...],
    "updatedAt": "2025-01-15T10:30:00Z"
  },
  {
    "_id": "groupId2",
    "name": "Fitness Squad",
    "description": "Weekly workouts",
    "category": "Fitness",
    "owner": {...},
    "members": [...],
    "updatedAt": "2025-01-14T15:20:00Z"
  }
]
```

**Notes:**
- Results sorted by `updatedAt` (newest first)
- Includes both owned and joined groups

---

### 3. Get Group Details

```http
GET /api/groups/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Get detailed information about a specific group

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
{
  "_id": "groupId123",
  "name": "Marketing Team",
  "description": "Q1 marketing initiatives",
  "category": "Productivity",
  "owner": {
    "_id": "ownerId",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "members": [
    {
      "user": {
        "_id": "userId1",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "role": "member",
      "joinedAt": "2025-01-15T11:00:00Z"
    }
  ],
  "memberCount": 2,
  "taskCount": 5,
  "completedTaskCount": 2,
  "completionRate": 40,
  "tasks": [
    {
      "status": "pending",
      "title": "Complete Q1 report",
      "description": "...",
      "dueDate": "2025-03-31"
    }
  ]
}
```

**Error Cases:**
- `403` - User not a member of this group
- `404` - Group not found

---

### 4. Update Group

```http
PUT /api/groups/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Update group details (owner only)

**URL Parameters:**
- `groupId` - ID of the group

**Request Body:**
```json
{
  "name": "Updated Group Name",
  "description": "Updated description",
  "category": "Learning"
}
```

**Success Response (200):**
```json
{
  "message": "Group updated successfully",
  "group": {
    "_id": "groupId123",
    "name": "Updated Group Name",
    "description": "Updated description",
    "category": "Learning",
    "owner": {...},
    "members": [...]
  }
}
```

**Error Cases:**
- `403` - Only owner can update group
- `404` - Group not found

---

### 5. Delete Group

```http
DELETE /api/groups/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Delete group and all associated tasks (owner only)

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
{
  "message": "Group and related tasks deleted successfully."
}
```

**Error Cases:**
- `403` - Only owner can delete group
- `404` - Group not found

**⚠️ Important:** Deleting a group also deletes all tasks within it.

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Create group
groupsAPI.create({
  name: "Marketing Team",
  description: "Q1 initiatives",
  category: "Productivity"
})

// Get all groups
groupsAPI.getAll()

// Get specific group
groupsAPI.getOne(groupId)

// Update group
groupsAPI.update(groupId, {
  name: "Updated Name",
  description: "Updated desc",
  category: "Learning"
})

// Delete group
groupsAPI.delete(groupId)
```

---

## Related Endpoints

- **Add Members:** See [Members Endpoints](./members.md)
- **Create Tasks:** See [Tasks Endpoints](./tasks.md)
- **Get Notifications:** See [Notifications Endpoints](./notifications.md)

---

## Related Files

- **Route File:** `backend/routes/groups.js`
- **Group Model:** `backend/models/Group.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Context:** `frontend/src/context/GroupContext.jsx`

---

[← Back to Endpoints Index](./README.md)
