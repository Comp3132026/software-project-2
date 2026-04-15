# 📡 API Endpoints Documentation

**Last Updated:** April 15, 2026  
**Repository:** software-project-2  
**Branch:** RicardoBurgos

---

## 📑 Table of Contents

1. **[Authentication (`/api/auth`)](./auth.md)** - 8 endpoints
2. **[Groups (`/api/groups`)](./groups.md)** - 5 endpoints
3. **[Tasks (`/api/tasks`)](./tasks.md)** - 6 endpoints
4. **[Members (`/api/members`)](./members.md)** - 5 endpoints
5. **[Notifications (`/api/notifications`)](./notifications.md)** - 10 endpoints
6. **[AI Features (`/api/ai`)](./ai.md)** - 3 endpoints
7. **[Chat (`/api/chat`)](./chat.md)** - 6 endpoints

---

## 🔐 Authentication

All endpoints **except** `/api/health` require JWT authentication.

### How to Authenticate

Include the token in the request header:
```
Authorization: Bearer <JWT_TOKEN>
```

The token is obtained after login/registration and stored in `localStorage`:
```javascript
localStorage.getItem('token')
```

---

## 📊 Endpoint Summary

| Module | Count | Protected | Route |
|--------|-------|-----------|-------|
| Auth | 8 | 6 | `/api/auth` |
| Groups | 5 | 5 | `/api/groups` |
| Tasks | 6 | 6 | `/api/tasks` |
| Members | 5 | 5 | `/api/members` |
| Notifications | 10 | 10 | `/api/notifications` |
| AI | 3 | 3 | `/api/ai` |
| Chat | 6 | 6 | `/api/chat` |
| **TOTAL** | **43** | **41** | - |

---

## ⚙️ Standard Error Response

All errors follow this format:

```json
{
  "message": "Error description",
  "error": "Additional details (optional)"
}
```

### Status Codes
- `200` - ✅ Success
- `201` - ✅ Created
- `400` - ❌ Bad Request
- `401` - ❌ Unauthorized (missing/invalid token)
- `403` - ❌ Forbidden (insufficient permissions)
- `404` - ❌ Not Found
- `500` - ❌ Server Error

---

## 🚀 Quick Start

### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Use Token
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📚 Related Documentation

- **Backend Routes Source:** `backend/routes/`
- **Frontend API Client:** `frontend/src/utils/api.js`
- **Authentication Middleware:** `backend/middleware/auth.js`
- **Database Models:** `backend/models/`
- **Main README:** `README.md`

---

## 🔗 Navigation

- [Auth Endpoints](./auth.md)
- [Groups Endpoints](./groups.md)
- [Tasks Endpoints](./tasks.md)
- [Members Endpoints](./members.md)
- [Notifications Endpoints](./notifications.md)
- [AI Endpoints](./ai.md)
- [Chat Endpoints](./chat.md)

---

**Last Generated:** April 15, 2026
