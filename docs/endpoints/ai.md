# 🤖 AI Features Endpoints (`/api/ai`)

**File:** `backend/routes/ai.js`  
**Total Endpoints:** 3  
**Protected:** 3 (all protected 🔒)  
**Requirements:** OpenAI API key in `.env`

---

## Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/suggest-task` | 🔒 | AI suggest task title/description |
| POST | `/suggest-assignee` | 🔒 | AI suggest assignee & due date |
| POST | `/suggest-priority` | 🔒 | AI suggest task priority |

---

## Detailed Endpoints

### 1. Suggest Task Details

```http
POST /api/ai/suggest-task
Authorization: Bearer <TOKEN>
```

**Description:** Generate improved task title and description using AI

**Request Body:**
```json
{
  "title": "finish report",
  "description": "need to write it",
  "groupName": "Marketing Team",
  "memberName": "John Doe"
}
```

**Parameters:**
- `title` - optional, raw task title
- `description` - optional, raw task description
- `groupName` - optional, context about the group
- `memberName` - optional, context about assignee

**Success Response (200):**
```json
{
  "title": "Complete Q1 Marketing Report",
  "description": "Prepare comprehensive Q1 marketing performance report including campaign metrics, ROI analysis, and recommendations for Q2 strategy",
  "tags": ["reporting", "quarterly", "marketing", "analysis"]
}
```

**Error Cases:**
- `500` - AI suggestion failed

**Notes:**
- Improves grammar and clarity
- Adds relevant tags for categorization
- Considers group and member context

---

### 2. Suggest Assignee

```http
POST /api/ai/suggest-assignee
Authorization: Bearer <TOKEN>
```

**Description:** AI recommends the best team member to assign task based on task priority and team stats

**Request Body:**
```json
{
  "groupId": "groupId123",
  "priority": "high"
}
```

**Parameters:**
- `groupId` - required, group to suggest members from
- `priority` - optional, task priority (`low`, `medium`, `high`)

**Success Response (200):**
```json
{
  "userId": "userId456",
  "name": "Jane Smith",
  "reason": "Jane has the most availability and strong track record with high-priority tasks",
  "dueDate": "2025-02-28"
}
```

**Details:**
- Analyzes team member workload
- Considers task completion history
- Recommends flexible due dates
- Returns exact user IDs for assignment

**Error Cases:**
- `404` - Group not found
- `500` - AI suggestion failed

---

### 3. Suggest Priority

```http
POST /api/ai/suggest-priority
Authorization: Bearer <TOKEN>
```

**Description:** AI analyzes task context and suggests appropriate priority level

**Request Body:**
```json
{
  "taskTitle": "Update company logo on website",
  "context": "Due next quarter, low urgency, visual design work"
}
```

**Parameters:**
- `taskTitle` - required, title of the task
- `context` - optional, additional context about the task

**Success Response (200):**
```json
{
  "suggestedPriority": "medium",
  "reason": "Visual updates typically benefit from medium priority to ensure timely completion without blocking critical items",
  "confidence": 0.85
}
```

**Details:**
- Suggests one of: `low`, `medium`, `high`
- Provides reasoning for recommendation
- Includes confidence score

**Error Cases:**
- `500` - AI suggestion failed

---

## Frontend API Usage

### Location: `frontend/src/utils/api.js`

```javascript
// Suggest task details
aiAPI.suggestTask({
  title: "finish report",
  description: "write it",
  groupName: "Marketing Team",
  memberName: "John"
})

// Suggest assignee
aiAPI.suggestAssignee({
  groupId: "groupId123",
  priority: "high"
})

// Suggest priority
aiAPI.suggestPriority({
  taskTitle: "Update company logo",
  context: "Visual design, due next quarter"
})
```

---

## Frontend Hook

### Location: `frontend/src/hooks/useAI.js`

```javascript
import { useAI } from '../hooks/useAI.js'

const MyComponent = () => {
  const { loading } = useAI()

  const suggestTaskDetails = async (payload) => {
    // Returns { title, description, tags }
  }

  const suggestAssignee = async ({ groupId, priority }) => {
    // Returns { userId, name, reason, dueDate }
  }

  const suggestPriority = async ({ taskTitle, context }) => {
    // Returns { suggestedPriority, reason, confidence }
  }

  return (...)
}
```

---

## Common Workflows

### 1. Generate Task from Raw Input
```javascript
// User enters rough task idea
const suggestion = await aiAPI.suggestTask({
  title: "finish stuff",
  description: "project thing",
  groupName: "Dev Team"
})

// Get improved title and description
const task = await tasksAPI.create({
  groupId: groupId,
  title: suggestion.title,        // "Complete project delivery"
  description: suggestion.description,
  priority: "high",
  dueDate: "2025-02-28"
})
```

### 2. Auto-Assign Task Intelligently
```javascript
// After creating task, get AI recommendation
const assignee = await aiAPI.suggestAssignee({
  groupId: groupId,
  priority: "high"
})

// Assign to recommended member
await tasksAPI.assign(taskId, {
  memberId: assignee.userId
})

// Notify user
console.log(`Assigned to ${assignee.name}: ${assignee.reason}`)
```

### 3. Suggest Priority Based on Description
```javascript
const priority = await aiAPI.suggestPriority({
  taskTitle: "Update customer dashboard",
  context: "Critical feature for new clients launching next month"
})

// Update task with suggestion
if (priority.confidence > 0.7) {
  await tasksAPI.update(taskId, {
    priority: priority.suggestedPriority
  })
}
```

---

## Configuration

### Environment Setup

Add to `backend/.env`:
```env
OPENAI_API_KEY=sk-your-openai-api-key
```

### Model Configuration

Current model: `gpt-5-nano` (specified in route file)

To use different models, modify `backend/routes/ai.js`:
```javascript
const completion = await client.chat.completions.create({
  model: 'gpt-4',          // Change model here
  messages: [{ role: 'user', content: prompt }],
  response_format: { type: 'json_object' }
})
```

---

## API Costs

OpenAI API usage incurs costs based on:
- Tokens used for requests
- Tokens used for responses
- Model selection

**Cost Estimation:**
- `gpt-5-nano`: ~$0.0005 per 1K tokens (most economical)
- `gpt-4`: ~$0.03 per 1K tokens (more powerful)

---

## Error Handling

```javascript
try {
  const suggestion = await aiAPI.suggestTask({
    title: "task",
    description: "description"
  })
} catch (error) {
  console.error(error.response?.data?.message)
  // "AI suggestion failed"
}
```

---

## Limitations

- OpenAI API key required
- Network latency depends on OpenAI availability
- Response time: typically 1-3 seconds
- Rate limits apply based on OpenAI plan
- Suggestions are recommendations only (user can override)

---

## Related Endpoints

- **Create Task:** See [Tasks Endpoints](./tasks.md)
- **Assign Task:** See [Tasks Endpoints](./tasks.md#6-assign-task-to-member)

---

## Related Files

- **Route File:** `backend/routes/ai.js`
- **Frontend Hook:** `frontend/src/hooks/useAI.js`
- **Frontend Client:** `frontend/src/utils/api.js`
- **Environment:** `backend/.env`

---

[← Back to Endpoints Index](./README.md)
