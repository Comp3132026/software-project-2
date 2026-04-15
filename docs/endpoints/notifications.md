# 🔔 Notifications Endpoints (`/api/notifications`)

**File:** `backend/routes/notifications.js`  
**Total Endpoints:** 10  
**Protected:** 10 (all protected 🔒)

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | 🔒 | Get all notifications |
| GET | `/group/:groupId` | 🔒 | Get group notifications |
| GET | `/history/:groupId` | 🔒 | Get group activity history |
| POST | `/announcement/:groupId` | 🔒 | Send announcement |
| POST | `/reminder/:taskId` | 🔒 | Set task reminder |
| GET | `/reminders` | 🔒 | Get upcoming reminders |
| PUT | `/:id/read` | 🔒 | Mark notification as read |
| PUT | `/read-all` | 🔒 | Mark all as read |
| GET | `/unread-count` | 🔒 | Get unread count |
| PUT | `/frequency` | 🔒 | Update notification frequency |

---

## Notification Types

- `announcement` - Group announcement from owner/moderator
- `reminder` - Task reminder notification
- `task_assigned` - User assigned to a task
- `task_completed` - Task completion update
- `member_joined` - New member joined group
- `member_left` - Member left group

---

## Detailed Endpoints

### 1. Get All Notifications

```http
GET /api/notifications
Authorization: Bearer <TOKEN>
```

**Description:** Get user's notifications (newest first, limit 50)

**Success Response (200):**
```json
[
  {
    "_id": "notifId1",
    "user": "userId",
    "group": {
      "_id": "groupId123",
      "name": "Marketing Team"
    },
    "type": "announcement",
    "message": "📢 Announcement from John: Meeting at 3pm",
    "isRead": false,
    "createdAt": "2025-01-17T14:30:00Z"
  },
  {
    "_id": "notifId2",
    "user": "userId",
    "group": {
      "_id": "groupId456",
      "name": "Fitness Squad"
    },
    "type": "reminder",
    "message": "⏰ Reminder set for 'Complete workout' on 01/18/2025",
    "isRead": true,
    "createdAt": "2025-01-16T09:00:00Z"
  }
]
```

---

### 2. Get Group Notifications

```http
GET /api/notifications/group/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Get notifications for a specific group (newest first, limit 50)

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
[
  {
    "_id": "notifId1",
    "user": "userId",
    "group": {
      "_id": "groupId123",
      "name": "Marketing Team"
    },
    "type": "announcement",
    "message": "📢 Announcement from John: Meeting at 3pm",
    "isRead": false,
    "createdAt": "2025-01-17T14:30:00Z"
  }
]
```

**Notes:**
- Only returns notifications for the logged-in user in this group

---

### 3. Get Group Activity History

```http
GET /api/notifications/history/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Get activity history log for a group (newest first, limit 50)

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
[
  {
    "_id": "historyId1",
    "group": "groupId123",
    "performedBy": {
      "_id": "userId1",
      "name": "John Doe"
    },
    "action": "Sent announcement",
    "details": "Team meeting at 3pm today",
    "createdAt": "2025-01-17T14:30:00Z"
  },
  {
    "_id": "historyId2",
    "group": "groupId123",
    "performedBy": {
      "_id": "userId2",
      "name": "Jane Doe"
    },
    "action": "Added member",
    "details": "Bob Smith joined as member",
    "createdAt": "2025-01-17T13:00:00Z"
  }
]
```

---

### 4. Send Announcement

```http
POST /api/notifications/announcement/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Send announcement to all group members (owner/moderator only)

**URL Parameters:**
- `groupId` - ID of the group

**Request Body:**
```json
{
  "message": "Team meeting rescheduled to Friday at 3pm"
}
```

**Success Response (200):**
```json
{
  "message": "Announcement sent",
  "count": 5
}
```

**Details:**
- Creates notification for each group member
- Logged to history with timestamp
- Automatically prefixed with sender's name

**Error Cases:**
- `400` - Message is required
- `403` - Only owners and moderators can send announcements
- `404` - Group not found

---

### 5. Set Task Reminder

```http
POST /api/notifications/reminder/:taskId
Authorization: Bearer <TOKEN>
```

**Description:** Set a reminder for a task

**URL Parameters:**
- `taskId` - ID of the task

**Request Body:**
```json
{
  "reminderDate": "2025-02-15T14:30:00Z",
  "reminderMessage": "Don't forget about the project deadline!"
}
```

**Parameters:**
- `reminderDate` - required, ISO format datetime
- `reminderMessage` - optional, custom message (default: "Reminder: {taskTitle}")

**Success Response (200):**
```json
{
  "message": "Reminder set successfully",
  "task": {
    "_id": "taskId123",
    "title": "Complete project proposal",
    "reminderDate": "2025-02-15T14:30:00Z",
    "reminderMessage": "Don't forget about the project deadline!",
    "reminderSet": true
  }
}
```

**Error Cases:**
- `400` - Reminder date is required
- `404` - Task not found

---

### 6. Get Upcoming Reminders

```http
GET /api/notifications/reminders
Authorization: Bearer <TOKEN>
```

**Description:** Get all upcoming reminders for tasks assigned to user

**Success Response (200):**
```json
[
  {
    "_id": "taskId1",
    "title": "Complete project proposal",
    "description": "Prepare and submit proposal",
    "group": {
      "_id": "groupId123",
      "name": "Marketing Team"
    },
    "reminderDate": "2025-02-15T14:30:00Z",
    "reminderMessage": "Don't forget!",
    "status": "in-progress",
    "priority": "high"
  }
]
```

**Notes:**
- Only returns reminders with future dates
- Only includes tasks assigned to current user

---

### 7. Mark Notification as Read

```http
PUT /api/notifications/:id/read
Authorization: Bearer <TOKEN>
```

**Description:** Mark a single notification as read

**URL Parameters:**
- `id` - ID of the notification

**Success Response (200):**
```json
{
  "_id": "notifId1",
  "user": "userId",
  "group": {
    "_id": "groupId123",
    "name": "Marketing Team"
  },
  "type": "announcement",
  "message": "📢 Announcement from John: Meeting at 3pm",
  "isRead": true,
  "createdAt": "2025-01-17T14:30:00Z"
}
```

**Error Cases:**
- `403` - Cannot mark other user's notification as read
- `404` - Notification not found

---

### 8. Mark All as Read

```http
PUT /api/notifications/read-all
Authorization: Bearer <TOKEN>
```

**Description:** Mark all unread notifications as read

**Success Response (200):**
```json
{
  "message": "All notifications marked as read."
}
```

**Notes:**
- Marks all user's unread notifications regardless of group

---

### 9. Get Unread Count

```http
GET /api/notifications/unread-count
Authorization: Bearer <TOKEN>
```

**Description:** Get count of unread notifications for user

**Success Response (200):**
```json
{
  "count": 3
}
```

---

### 10. Update Notification Frequency

```http
PUT /api/notifications/frequency
Authorization: Bearer <TOKEN>
```

**Description:** Update user's notification delivery frequency

**Request Body:**
```json
{
  "frequency": "weekly"
}
```

**Valid Frequencies:**
```
"instant"   // Real-time notifications
"daily"     // Once per day
"weekly"    // Once per week
"never"     // Disable notifications
```

**Success Response (200):**
```json
{
  "message": "Frequency updated",
  "frequency": "weekly"
}
```

**Error Cases:**
- `400` - Frequency is required

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Get all notifications
notificationsAPI.getAll()

// Get group notifications
notificationsAPI.getByGroup(groupId)

// Get activity history
notificationsAPI.getHistory(groupId)

// Send announcement
notificationsAPI.sendAnnouncement(groupId, "Team meeting at 3pm")

// Set reminder
notificationsAPI.setReminder(taskId, {
  reminderDate: "2025-02-15T14:30:00Z",
  reminderMessage: "Don't forget!"
})

// Get upcoming reminders
notificationsAPI.getReminders()

// Mark as read
notificationsAPI.markRead(notificationId)

// Mark all as read
notificationsAPI.markAllRead()

// Get unread count
notificationsAPI.getUnreadCount()

// Update frequency
notificationsAPI.updateFrequency("daily")
```

---

## Common Workflows

### Send Announcement to Team
```javascript
await notificationsAPI.sendAnnouncement(
  groupId,
  "Quarterly goals deadline: Friday EOD"
)
```

### Set Task Reminder
```javascript
await notificationsAPI.setReminder(taskId, {
  reminderDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
  reminderMessage: "Project deadline approaching"
})
```

### Check Team Activity
```javascript
const history = await notificationsAPI.getHistory(groupId)
```

### Mark Notification as Read
```javascript
await notificationsAPI.markRead(notificationId)
```

---

## Related Endpoints

- **Create Group:** See [Groups Endpoints](./groups.md)
- **Create Task:** See [Tasks Endpoints](./tasks.md)
- **Change Role:** See [Members Endpoints](./members.md) (moderator required for announcements)

---

## Related Files

- **Route File:** `backend/routes/notifications.js`
- **Notification Model:** `backend/models/Notification.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Notification Context:** `frontend/src/context/NotificationContext.jsx`

---

[← Back to Endpoints Index](./README.md)
