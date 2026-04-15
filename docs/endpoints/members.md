# 👥 Members Endpoints (`/api/members`)

**File:** `backend/routes/members.js`  
**Total Endpoints:** 5  
**Protected:** 5 (all protected 🔒)

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/group/:groupId` | 🔒 | Get group members |
| POST | `/group/:groupId/add` | 🔒 | Add member to group |
| GET | `/search?q=query&groupId=id` | 🔒 | Search friends to add |
| PUT | `/group/:groupId/:userId/role` | 🔒 | Change member role |
| POST | `/group/:groupId/leave` | 🔒 | Leave group |

---

## Data Types

**Valid Roles:** `owner`, `moderator`, `member`, `viewer`

**Role Hierarchy:**
- `owner` - Full control (level 4)
- `moderator` - Can manage members and announcements (level 3)
- `member` - Can create and manage tasks (level 2)
- `viewer` - Read-only access (level 1)

---

## Detailed Endpoints

### 1. Get Group Members

```http
GET /api/members/group/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Get all members in a group

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
[
  {
    "userId": "userId1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "owner",
    "joinedAt": "2025-01-15T10:30:00Z"
  },
  {
    "userId": "userId2",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "member",
    "joinedAt": "2025-01-16T14:22:00Z"
  }
]
```

**Error Cases:**
- `403` - User not a member of this group
- `404` - Group not found

---

### 2. Add Member to Group

```http
POST /api/members/group/:groupId/add
Authorization: Bearer <TOKEN>
```

**Description:** Add a user to the group (owner only)

**URL Parameters:**
- `groupId` - ID of the group

**Request Body:**
```json
{
  "userId": "userId123",
  "role": "member"
}
```

**Parameters:**
- `userId` - required, ID of user to add
- `role` - optional, defaults to `member`. One of: `owner`, `moderator`, `member`, `viewer`

**Success Response (200):**
```json
{
  "message": "Member added successfully",
  "members": [
    {
      "userId": "userId1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "joinedAt": "2025-01-15T10:30:00Z"
    },
    {
      "userId": "userId123",
      "name": "New Member",
      "email": "newmember@example.com",
      "role": "member",
      "joinedAt": "2025-01-17T09:15:00Z"
    }
  ]
}
```

**Error Cases:**
- `400` - User already a member
- `400` - Invalid role
- `403` - Only owner can add members
- `404` - User not found
- `404` - Group not found

---

### 3. Search Friends to Add

```http
GET /api/members/search?q=query&groupId=groupId
Authorization: Bearer <TOKEN>
```

**Description:** Search user's friends to add to a group

**Query Parameters:**
- `q` - Search query (name or email)
- `groupId` - optional, group to filter existing members

**Success Response (200):**
```json
[
  {
    "_id": "friendId1",
    "name": "Jane Smith",
    "email": "jane.smith@example.com"
  },
  {
    "_id": "friendId2",
    "name": "Bob Johnson",
    "email": "bob.johnson@example.com"
  }
]
```

**Notes:**
- Only searches among user's friends
- Excludes existing group members if `groupId` provided
- Case-insensitive search

---

### 4. Change Member Role

```http
PUT /api/members/group/:groupId/:userId/role
Authorization: Bearer <TOKEN>
```

**Description:** Update a member's role (owner only)

**URL Parameters:**
- `groupId` - ID of the group
- `userId` - ID of the member to update

**Request Body:**
```json
{
  "role": "moderator"
}
```

**Valid Roles:**
```
"owner"      // Full control
"moderator"  // Can manage members and announcements
"member"     // Can create and manage tasks
"viewer"     // Read-only access
```

**Success Response (200):**
```json
{
  "message": "Role updated successfully",
  "members": [
    {
      "userId": "userId1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "owner",
      "joinedAt": "2025-01-15T10:30:00Z"
    },
    {
      "userId": "userId2",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "moderator",
      "joinedAt": "2025-01-16T14:22:00Z"
    }
  ]
}
```

**Special Cases:**
- If promoting to `owner`: current owner becomes `member`
- Cannot demote owner through this endpoint directly

**Error Cases:**
- `400` - Cannot demote owner
- `400` - Invalid role
- `403` - Only owner can change roles
- `404` - Member not found in group
- `404` - Group not found

---

### 5. Leave Group

```http
POST /api/members/group/:groupId/leave
Authorization: Bearer <TOKEN>
```

**Description:** Current user leaves the group

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
{
  "message": "You have left the group successfully."
}
```

**Error Cases:**
- `400` - Cannot leave if owner (must transfer ownership first)
- `400` - User not a member of this group
- `404` - Group not found

**⚠️ Important:** Owner cannot leave group without transferring ownership first. Use role change endpoint to transfer ownership.

---

## Role-Based Permissions

| Action | Owner | Moderator | Member | Viewer |
|--------|-------|-----------|--------|--------|
| View group | ✅ | ✅ | ✅ | ✅ |
| View members | ✅ | ✅ | ✅ | ✅ |
| Add members | ✅ | ❌ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ✅ | ❌ |
| Edit group | ✅ | ❌ | ❌ | ❌ |
| Send announcement | ✅ | ✅ | ❌ | ❌ |
| Delete group | ✅ | ❌ | ❌ | ❌ |

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Get group members
membersAPI.getByGroup(groupId)

// Add member
membersAPI.add(groupId, {
  userId: "userId123",
  role: "member"
})

// Search friends to add
membersAPI.search(query, groupId)

// Update member role
membersAPI.updateRole(groupId, userId, {
  role: "moderator"
})

// Remove member
membersAPI.remove(groupId, userId)

// Leave group
membersAPI.leave(groupId)

// Flag member as inactive
membersAPI.flag(groupId, memberId, {
  flag: "inactive"
})
```

---

## Common Workflows

### Add Member to Group
```javascript
// 1. Search for friend
const friends = await membersAPI.search("jane", groupId)

// 2. Add selected friend
await membersAPI.add(groupId, {
  userId: friends[0]._id,
  role: "member"
})

// 3. Refresh members list
const members = await membersAPI.getByGroup(groupId)
```

### Promote Member
```javascript
await membersAPI.updateRole(groupId, userId, {
  role: "moderator"
})
```

### Transfer Ownership
```javascript
// Current owner promotes new owner
await membersAPI.updateRole(groupId, newOwnerId, {
  role: "owner"
})
// User automatically becomes owner, old owner becomes member
```

---

## Related Endpoints

- **Get Group:** See [Groups Endpoints](./groups.md)
- **Create Tasks:** See [Tasks Endpoints](./tasks.md)
- **Send Announcement:** See [Notifications Endpoints](./notifications.md)

---

## Related Files

- **Route File:** `backend/routes/members.js`
- **Group Model:** `backend/models/Group.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Member Actions Hook:** `frontend/src/hooks/useMemberActions.js`

---

[← Back to Endpoints Index](./README.md)
