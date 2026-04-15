# 🔐 Authentication Endpoints (`/api/auth`)

**File:** `backend/routes/auth.js`  
**Total Endpoints:** 8  
**Protected:** 6 (marked with 🔒)

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ✗ | Register new user |
| POST | `/login` | ✗ | Login user |
| GET | `/me` | 🔒 | Get current user |
| PUT | `/me` | 🔒 | Update user profile |
| GET | `/friends` | 🔒 | Get friends list |
| POST | `/friends/:userId` | 🔒 | Add friend (bi-directional) |
| DELETE | `/friends/:userId` | 🔒 | Remove friend (bi-directional) |
| GET | `/search?q=query` | 🔒 | Search users |

---

## Detailed Endpoints

### 1. Register

```http
POST /api/auth/register
```

**Description:** Create a new user account

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules:**
- `name`: min 2 characters
- `email`: valid email format
- `password`: min 6 characters

**Success Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "_id": "userId123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Response (400):**
```json
{
  "message": "User with this email already exists.",
  "errors": [...]
}
```

---

### 2. Login

```http
POST /api/auth/login
```

**Description:** Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "_id": "userId123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Response (401):**
```json
{
  "message": "Invalid email or password."
}
```

---

### 3. Get Current User

```http
GET /api/auth/me
Authorization: Bearer <TOKEN>
```

**Description:** Get profile of authenticated user

**Success Response (200):**
```json
{
  "_id": "userId123",
  "name": "John Doe",
  "email": "john@example.com",
  "friends": ["friendId1", "friendId2"],
  "notificationFrequency": "daily"
}
```

---

### 4. Update User Profile

```http
PUT /api/auth/me
Authorization: Bearer <TOKEN>
```

**Description:** Update current user's profile information

**Request Body:**
```json
{
  "name": "John Smith",
  "notificationFrequency": "weekly"
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated",
  "user": {...}
}
```

---

### 5. Get Friends List

```http
GET /api/auth/friends
Authorization: Bearer <TOKEN>
```

**Description:** Get array of user's friends

**Success Response (200):**
```json
[
  {
    "_id": "friendId1",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  {
    "_id": "friendId2",
    "name": "Bob Smith",
    "email": "bob@example.com"
  }
]
```

---

### 6. Add Friend

```http
POST /api/auth/friends/:userId
Authorization: Bearer <TOKEN>
```

**Description:** Add another user as friend (mutual/bi-directional)

**URL Parameters:**
- `userId` - ID of user to add as friend

**Success Response (200):**
```json
{
  "success": true,
  "message": "Friend added",
  "friends": [
    {
      "_id": "friendId1",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  ]
}
```

**Error Cases:**
- `400` - Cannot add yourself as friend
- `400` - Already friends
- `404` - User not found

---

### 7. Remove Friend

```http
DELETE /api/auth/friends/:userId
Authorization: Bearer <TOKEN>
```

**Description:** Remove user from friends list (mutual removal)

**URL Parameters:**
- `userId` - ID of friend to remove

**Success Response (200):**
```json
{
  "success": true,
  "message": "Friend removed",
  "friends": [...]
}
```

**Error Cases:**
- `404` - User not found

---

### 8. Search Users

```http
GET /api/auth/search?q=query
Authorization: Bearer <TOKEN>
```

**Description:** Find users by name or email

**Query Parameters:**
- `q` - Search query (min 2 characters)

**Success Response (200):**
```json
[
  {
    "_id": "userId1",
    "name": "John Smith",
    "email": "john.smith@example.com"
  },
  {
    "_id": "userId2",
    "name": "Johnny Doe",
    "email": "johnny@example.com"
  }
]
```

**Notes:**
- Returns max 10 results
- Excludes current user from results
- Case-insensitive search

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Register
authAPI.register({
  name: "John Doe",
  email: "john@example.com",
  password: "password123"
})

// Login
authAPI.login({
  email: "john@example.com",
  password: "password123"
})

// Get current user
authAPI.getMe()

// Update profile
authAPI.updateMe({ name: "Jane Doe" })

// Get friends
authAPI.getFriends()

// Add friend
authAPI.addFriend(userId)

// Remove friend
authAPI.removeFriend(userId)

// Search users
authAPI.searchUsers("query")
```

---

## Error Handling Examples

```javascript
try {
  const response = await authAPI.login({
    email: "test@example.com",
    password: "wrong"
  });
} catch (error) {
  console.error(error.response?.data?.message);
  // "Invalid email or password."
}
```

---

## Related Files

- **Route File:** `backend/routes/auth.js`
- **User Model:** `backend/models/User.js`
- **Auth Middleware:** `backend/middleware/auth.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Context:** `frontend/src/context/AuthContext.jsx`

---

[← Back to Endpoints Index](./README.md)
