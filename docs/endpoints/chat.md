# 💬 Chat Endpoints (`/api/chat`)

**File:** `backend/routes/chat.js`  
**Total Endpoints:** 6  
**Protected:** 6 (all protected 🔒)

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/group/:groupId` | 🔒 | Get group messages |
| POST | `/` | 🔒 | Send message |
| DELETE | `/:id` | 🔒 | Delete message |
| POST | `/:id/report` | 🔒 | Report message |
| PATCH | `/pin/:id` | 🔒 | Pin message |
| POST | `/:id/warn` | 🔒 | Warn user (moderator only) |

---

## Detailed Endpoints

### 1. Get Group Messages

```http
GET /api/chat/group/:groupId
Authorization: Bearer <TOKEN>
```

**Description:** Get all messages in a group (newest first)

**URL Parameters:**
- `groupId` - ID of the group

**Success Response (200):**
```json
[
  {
    "_id": "messageId1",
    "group": "groupId123",
    "sender": {
      "_id": "userId1",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "content": "Anyone free for lunch?",
    "attachments": [],
    "isPinned": false,
    "reactions": [
      {
        "user": "userId2",
        "type": "like",
        "createdAt": "2025-01-17T12:30:00Z"
      }
    ],
    "createdAt": "2025-01-17T12:00:00Z",
    "updatedAt": "2025-01-17T12:00:00Z"
  }
]
```

**Notes:**
- All group members can view messages
- Includes reactions and pin status

---

### 2. Send Message

```http
POST /api/chat
Authorization: Bearer <TOKEN>
```

**Description:** Send a message to a group

**Request Body:**
```json
{
  "groupId": "groupId123",
  "message": "Anyone available for a quick sync?",
  "attachments": [
    {
      "type": "link",
      "url": "https://example.com",
      "name": "Project Link"
    }
  ]
}
```

**Parameters:**
- `groupId` - required, group to send to
- `message` - required, message content
- `attachments` - optional, array of attachments

**Attachment Types:**
- `link` - URL attachment
- `image` - Image attachment
- `file` - File attachment

**Success Response (201):**
```json
{
  "_id": "messageId1",
  "group": "groupId123",
  "sender": {
    "_id": "userId1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "content": "Anyone available for a quick sync?",
  "attachments": [
    {
      "type": "link",
      "url": "https://example.com",
      "name": "Project Link"
    }
  ],
  "isPinned": false,
  "reactions": [],
  "createdAt": "2025-01-17T14:30:00Z"
}
```

**Error Cases:**
- `400` - Message or groupId required
- `403` - User not a member of this group
- `404` - Group not found

---

### 3. Delete Message

```http
DELETE /api/chat/:id
Authorization: Bearer <TOKEN>
```

**Description:** Delete a message (sender or moderator only)

**URL Parameters:**
- `id` - ID of the message

**Success Response (200):**
```json
{
  "message": "Message deleted"
}
```

**Permissions:**
- Message sender can delete their own messages
- Moderators can delete any message

**Error Cases:**
- `403` - Only sender or moderator can delete message
- `404` - Message not found

---

### 4. Report Message

```http
POST /api/chat/:id/report
Authorization: Bearer <TOKEN>
```

**Description:** Report a message for inappropriate content

**URL Parameters:**
- `id` - ID of the message

**Request Body:**
```json
{
  "reason": "Inappropriate language"
}
```

**Reasons:**
```
"Inappropriate language"
"Spam"
"Harassment"
"Off-topic"
"Other"
```

**Success Response (200):**
```json
{
  "message": "Message reported",
  "reportId": "reportId123"
}
```

**Notes:**
- Reports are logged for moderation review
- User cannot report themselves
- Can report same message once per user

---

### 5. Pin Message

```http
PATCH /api/chat/pin/:id
Authorization: Bearer <TOKEN>
```

**Description:** Pin a message to group (moderator only)

**URL Parameters:**
- `id` - ID of the message

**Success Response (200):**
```json
{
  "message": "Message pinned",
  "_id": "messageId1",
  "isPinned": true,
  "content": "Important announcement for everyone"
}
```

**Notes:**
- Only moderators can pin messages
- Pinned messages appear at top of chat history
- Can have multiple pinned messages

**Error Cases:**
- `403` - Only moderators can pin messages
- `404` - Message not found

---

### 6. Warn User

```http
POST /api/chat/:id/warn
Authorization: Bearer <TOKEN>
```

**Description:** Send warning to user for message (moderator only)

**URL Parameters:**
- `id` - ID of the message (sent by user to warn)

**Request Body:**
```json
{
  "message": "Please keep discussions professional and on-topic"
}
```

**Success Response (200):**
```json
{
  "message": "User warned",
  "warningId": "warningId123",
  "userWarned": {
    "_id": "userId2",
    "name": "Jane Doe",
    "warnings": 1
  }
}
```

**Notes:**
- Only moderators can warn users
- Warning logged in user's profile
- System tracks multiple warnings

**Error Cases:**
- `403` - Only moderators can warn users
- `404` - Message or user not found

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Get messages
chatAPI.getMessages(groupId)

// Send message
chatAPI.send({
  groupId: "groupId123",
  message: "Hello team!",
  attachments: []
})

// Delete message
chatAPI.delete(messageId)

// Report message
chatAPI.report(messageId, {
  reason: "Inappropriate language"
})

// Pin message (moderator)
chatAPI.pin(messageId)

// Warn user (moderator)
chatAPI.warn(messageId, {
  message: "Please be professional"
})
```

---

## Common Workflows

### 1. Send Message with Attachment
```javascript
await chatAPI.send({
  groupId: groupId,
  message: "Check out this design mockup",
  attachments: [
    {
      type: "image",
      url: "https://example.com/mockup.png",
      name: "Design Mockup"
    }
  ]
})
```

### 2. Report Inappropriate Message
```javascript
await chatAPI.report(messageId, {
  reason: "Harassment"
})
```

### 3. Pin Important Announcement
```javascript
// Moderator pins important message
await chatAPI.pin(announcementMessageId)
```

### 4. Warn User for Behavior
```javascript
// Moderator warns user
await chatAPI.warn(messageId, {
  message: "Keep discussions professional and relevant to group goals"
})
```

---

## Message Operations by Role

| Operation | Owner | Moderator | Member | Viewer |
|-----------|-------|-----------|--------|--------|
| View messages | ✅ | ✅ | ✅ | ✅ |
| Send message | ✅ | ✅ | ✅ | ❌ |
| Delete own | ✅ | ✅ | ✅ | ❌ |
| Delete others | ✅ | ✅ | ❌ | ❌ |
| Report message | ✅ | ✅ | ✅ | ✅ |
| Pin message | ✅ | ✅ | ❌ | ❌ |
| Warn user | ✅ | ✅ | ❌ | ❌ |

---

## Related Endpoints

- **Get Group:** See [Groups Endpoints](./groups.md)
- **Get Members:** See [Members Endpoints](./members.md)

---

## Related Files

- **Route File:** `backend/routes/chat.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Chat Component:** `frontend/src/components/ChatPanel.jsx`

---

[← Back to Endpoints Index](./README.md)
