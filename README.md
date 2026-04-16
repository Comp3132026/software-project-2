<p align="center">
  <img src="./frontend/public/favicon.png" alt="LifeSync Logo" width="80" height="80">
</p>

<h1 align="center">LifeSync</h1>

<p align="center">
  <strong>Collaborative Task & Habit Tracking for Teams</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#demo">Demo</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#api">API</a> •
  <a href="#testing">Testing</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/tests-117%20passing-brightgreen.svg" alt="Tests">
  <img src="https://img.shields.io/badge/eslint-passing-brightgreen.svg" alt="ESLint">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

<br>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Contributing](#contributing)
- [Acknowledgments](#acknowledgments)

---

## 🎯 About

**LifeSync** is a full-stack collaborative platform designed to help teams manage tasks, track habits, and communicate effectively. Built with modern web technologies, it offers real-time updates, AI-powered suggestions, and a beautiful, intuitive interface.

Whether you're managing a small project team or coordinating across departments, LifeSync provides the tools you need to stay organized and productive.

### Why LifeSync?

- **🚀 Boost Productivity** — Streamline task management with smart prioritization
- **👥 Enhance Collaboration** — Real-time chat and shared task boards
- **🤖 AI-Powered** — Intelligent task suggestions and auto-assignment
- **🔒 Secure** — Role-based access control with granular permissions
- **📱 Responsive** — Beautiful on desktop, tablet, and mobile

---

## ✨ Features

<table>
<tr>
<td width="50%">

### Core Features

- ✅ **User Authentication**
  - Secure JWT-based login/registration
  - Password encryption with bcrypt
  - Persistent sessions

- ✅ **Group Management**
  - Create and customize groups
  - Multiple privacy settings
  - Category organization

- ✅ **Task Tracking**
  - Create, assign, and track tasks
  - Priority levels (High/Medium/Low)
  - Due date management
  - Status workflow (Pending → In Progress → Completed)

</td>
<td width="50%">

### Advanced Features

- 🤖 **AI Assistant**
  - Smart task title/description suggestions
  - Auto-priority detection
  - Intelligent assignee recommendations

- 💬 **Real-Time Chat**
  - Group messaging with Socket.IO
  - Message moderation
  - Instant notifications

- 👥 **Role-Based Access Control**
  - Owner, Moderator, Member, Viewer roles
  - Granular permission management
  - Role delegation

</td>
</tr>
</table>

### Role Permissions Matrix

| Permission | 👑 Owner | 🛡️ Moderator | 👤 Member | 👁️ Viewer |
|:-----------|:--------:|:------------:|:---------:|:---------:|
| View Tasks & Chat | ✅ | ✅ | ✅ | ✅ |
| Create Tasks | ✅ | ✅ | ✅ | ❌ |
| Edit Own Tasks | ✅ | ✅ | ✅ | ❌ |
| Delete Any Task | ✅ | ✅ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ | ❌ |
| Moderate Chat | ✅ | ✅ | ❌ | ❌ |
| Edit Group Settings | ✅ | ❌ | ❌ | ❌ |
| Delete Group | ✅ | ❌ | ❌ | ❌ |
| Transfer Ownership | ✅ | ❌ | ❌ | ❌ |

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br><strong>React 18</strong>
<br><sub>Frontend Library</sub>
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br><strong>Tailwind CSS</strong>
<br><sub>Styling</sub>
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" />
<br><strong>Vite</strong>
<br><sub>Build Tool</sub>
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=nodejs" width="48" height="48" alt="Node.js" />
<br><strong>Node.js</strong>
<br><sub>Runtime</sub>
</td>
</tr>
<tr>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=express" width="48" height="48" alt="Express" />
<br><strong>Express.js</strong>
<br><sub>Backend Framework</sub>
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=mongodb" width="48" height="48" alt="MongoDB" />
<br><strong>MongoDB</strong>
<br><sub>Database</sub>
</td>
<td align="center" width="150">
<img src="https://socket.io/images/logo.svg" width="48" height="48" alt="Socket.IO" />
<br><strong>Socket.IO</strong>
<br><sub>Real-Time</sub>
</td>
<td align="center" width="150">
<img src="https://skillicons.dev/icons?i=jest" width="48" height="48" alt="Jest" />
<br><strong>Jest + Vitest</strong>
<br><sub>Testing</sub>
</td>
</tr>
</table>

### Additional Technologies

| Category | Technologies |
|----------|-------------|
| **Authentication** | JWT, bcrypt |
| **API** | RESTful, Express Validator |
| **AI Integration** | OpenAI API |
| **Code Quality** | ESLint, Prettier, JSDoc |
| **Fonts** | Plus Jakarta Sans, Clash Display |

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) — [Download](https://nodejs.org/)
- **MongoDB** (v6.0 or higher) — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)
- **npm** (v9.0.0 or higher) or **yarn**
- **Git** — [Download](https://git-scm.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/lifesync.git
   cd lifesync
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. **Create environment file**

   Create a `.env` file in the `backend` directory:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/lifesync

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-in-production

   # AI Features (Optional)
   OPENAI_API_KEY=sk-your-openai-api-key
   ```

2. **Configure frontend API URL** (if needed)

   Update `frontend/src/utils/api.js` if your backend runs on a different port.

### Running the Application

**Option 1: Run separately**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2: Using concurrently** (if configured)

```bash
npm run dev
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 📖 Usage

### Creating Your First Group

1. **Register/Login** — Create an account or sign in
2. **Create Group** — Click "Create Group" and fill in details
3. **Invite Members** — Share the group code or add members directly
4. **Create Tasks** — Add tasks with priorities and due dates
5. **Collaborate** — Use chat, track progress, and celebrate completions!

### Quick Actions

| Action | How To |
|--------|--------|
| Create Task | Click "+" button in any group |
| Change Task Status | Click the status badge on any task |
| Assign Member | Select assignee in task form |
| Send Message | Use the chat panel in group view |
| Change Role | Group Settings → Members → Edit Role |

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | User login |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/logout` | User logout |

### Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/groups` | Get user's groups |
| `POST` | `/api/groups` | Create new group |
| `GET` | `/api/groups/:id` | Get group details |
| `PUT` | `/api/groups/:id` | Update group |
| `DELETE` | `/api/groups/:id` | Delete group |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/groups/:id/tasks` | Get group tasks |
| `POST` | `/api/groups/:id/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `PATCH` | `/api/tasks/:id/status` | Update task status |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/groups/:id/members` | Get group members |
| `POST` | `/api/groups/:id/members` | Add member |
| `PUT` | `/api/members/:id/role` | Update member role |
| `DELETE` | `/api/members/:id` | Remove member |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/groups/:id/messages` | Get chat messages |
| `POST` | `/api/groups/:id/messages` | Send message |
| `DELETE` | `/api/messages/:id` | Delete message |

<details>
<summary><strong>📋 Example API Request</strong></summary>

```javascript
// Create a new task
const response = await fetch('/api/groups/123/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    title: 'Complete project documentation',
    description: 'Write comprehensive README and API docs',
    priority: 'high',
    dueDate: '2025-12-31',
    assignedTo: 'user456'
  })
});

const task = await response.json();
```

</details>

---

## 📁 Project Structure

```
lifesync/
├── 📂 backend/
│   ├── 📂 __tests__/           # Jest unit tests
│   │   └── helpers.test.js     # Backend utility tests (70 tests)
│   ├── 📂 config/
│   │   └── db.js               # Database configuration
│   ├── 📂 controllers/
│   │   └── groupController.js  # Group business logic
│   ├── 📂 middleware/
│   │   └── auth.js             # JWT authentication
│   ├── 📂 models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── Task.js
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── 📂 routes/
│   │   ├── auth.js
│   │   ├── groups.js
│   │   ├── tasks.js
│   │   ├── members.js
│   │   ├── chat.js
│   │   └── ai.js
│   ├── 📂 services/
│   │   └── memberService.js
│   ├── 📂 utils/
│   │   └── helpers.js          # Utility functions
│   ├── server.js               # Express entry point
│   └── package.json
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 __tests__/       # Vitest unit tests
│   │   │   └── utils/
│   │   │       └── frontend.test.js  # Frontend tests (47 tests)
│   │   ├── 📂 components/
│   │   │   ├── Header.jsx
│   │   │   ├── GroupCard.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   ├── MemberList.jsx
│   │   │   └── ...
│   │   ├── 📂 context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── 📂 hooks/
│   │   │   ├── useChat.js
│   │   │   ├── useGroupData.js
│   │   │   ├── filterTasks.js
│   │   │   └── formatTime.js
│   │   ├── 📂 pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── GroupDetail.jsx
│   │   │   └── MyTasks.jsx
│   │   ├── 📂 utils/
│   │   │   ├── api.js
│   │   │   ├── constants.js
│   │   │   └── groupRoles.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── 📂 docs/
│   ├── 📂 Activity/            # Activity diagrams
│   ├── 📂 Sequence/            # Sequence diagrams
│   └── 📂 screenshots/         # App screenshots
│
├── TESTING.md                  # Testing documentation
├── README.md                   # This file
└── .gitignore
```

---

## 🧪 Testing

LifeSync includes **117 unit tests** covering 10 core methods across backend and frontend.

### Test Summary

| Location | Framework | Tests | Coverage |
|----------|-----------|-------|----------|
| Backend | Jest | 70 | 5 methods |
| Frontend | Vitest | 47 | 5 methods |
| **Total** | | **117** | **10 methods** |

### Running Tests

```bash
# Backend tests
cd backend
npm test                 # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# Frontend tests
cd frontend
npm run test:run         # Run once
npm test                 # Watch mode
npm run test:coverage    # With coverage report
```

### Tested Methods

<details>
<summary><strong>Backend Methods (5)</strong></summary>

| Method | Tests | Purpose |
|--------|-------|---------|
| `validateEmail()` | 14 | Email format validation |
| `validatePassword()` | 9 | Password requirements check |
| `checkPermission()` | 21 | Role-based permission verification |
| `sanitizeInput()` | 14 | Input sanitization & XSS prevention |
| `calculateTaskStats()` | 12 | Task statistics calculation |

</details>

<details>
<summary><strong>Frontend Methods (5)</strong></summary>

| Method | Tests | Purpose |
|--------|-------|---------|
| `computeGroupRoles()` | 12 | RBAC permission computation |
| `isOverdue()` | 8 | Due date comparison |
| `filterTasks()` | 8 | Task array filtering |
| `getPriorityBadge()` | 10 | Priority badge configuration |
| `getStatusBadge()` | 9 | Status badge configuration |

</details>

For detailed testing documentation, see [TESTING.md](./TESTING.md).

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Getting Started

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests**
   ```bash
   cd backend && npm test
   cd ../frontend && npm run test:run
   ```
5. **Run linting**
   ```bash
   cd frontend && npm run lint
   ```
6. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
8. **Open a Pull Request**

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |

### Code Style

- **ESLint** — All code must pass ESLint checks
- **Prettier** — Code is auto-formatted
- **JSDoc** — Document all functions
- **Tests** — Add tests for new features


## 🙏 Acknowledgments

- [React](https://react.dev/) — UI Library
- [Tailwind CSS](https://tailwindcss.com/) — CSS Framework
- [MongoDB](https://www.mongodb.com/) — Database
- [Socket.IO](https://socket.io/) — Real-time Engine
- [OpenAI](https://openai.com/) — AI Integration
- [Lucide Icons](https://lucide.dev/) — Icon Library

---

<p align="center">
  <strong>Built with ❤️the love of the LifeSync Team</strong>
</p>

<p align="center">
  <a href="#top">⬆️ Back to Top</a>
</p>
