const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Group = require('../models/Group');
const Task = require('../models/Task');
const { auth } = require('../middleware/auth');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------------------------------
   HELPERS
------------------------------------------- */

// Avg completion time
function averageCompletionTime(tasks) {
  const completed = tasks.filter((t) => t.completedAt && t.createdAt);
  if (completed.length === 0) {
    return null;
  }

  const durations = completed.map((t) => new Date(t.completedAt) - new Date(t.createdAt));

  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

// Task counts
function getTaskCounts(tasks) {
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const active = tasks.filter((t) => t.status === 'pending' || t.status === 'in-progress').length;

  return {
    completed,
    active,
    total: tasks.length,
  };
}

/* ------------------------------------------
   1. AI Suggest Task (title + description)
------------------------------------------- */
router.post('/suggest-task', auth, async (req, res) => {
  try {
    const { title, description, groupName, memberName } = req.body;

    const prompt = `
You are an AI assistant inside a productivity app called LifeSync.
Generate improved task suggestions based on these inputs:

- Raw title: ${title || 'none'}
- Raw description: ${description || 'none'}
- Group name: ${groupName || 'none'}
- Assigned to: ${memberName || 'none'}

Return ONLY JSON:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "..."]
}
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);
    res.json(parsed);
  } catch (error) {
    console.log('AI task suggestion error:', error);
    res.status(500).json({ message: 'AI suggestion failed' });
  }
});

/* ------------------------------------------
   2. AI Suggest Assignee (FIXED FOR memberId)
------------------------------------------- */
router.post('/suggest-assignee', auth, async (req, res) => {
  try {
    const { groupId, priority } = req.body;

    const group = await Group.findById(groupId).populate('members.user', 'name');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const tasks = await Task.find({ group: groupId });

    // Calculate stats for each member
    const stats = group.members.map((m) => {
      const userId = m.user?._id?.toString();
      const name = m.user?.name || 'Unknown';

      const userTasks = tasks.filter((t) => t.assignedTo?.toString() === userId);

      const completed = userTasks.filter((t) => t.status === 'completed').length;

      const active = userTasks.filter(
        (t) => t.status === 'pending' || t.status === 'in-progress'
      ).length;

      return {
        userId,
        name,
        completed,
        total: userTasks.length,
        active,
        completionRate: userTasks.length === 0 ? 0 : completed / userTasks.length,
        workload: active,
        avgCompletionTime: averageCompletionTime(userTasks),
      };
    });

    // Allowed IDs = userId
    const allowedUserIds = stats.map((m) => m.userId);

    const prompt = `
You are an AI assistant selecting the BEST member for a task.

STRICT RULES:
1. "userId" MUST be EXACTLY one of:
   ${allowedUserIds.map((id) => `"${id}"`).join(', ')}
2. NEVER invent or modify IDs.
3. NEVER return any ID that is NOT in the allowed list.
4. dueDate MUST use format YYYY-MM-DD.
5. JSON ONLY.

Members:
${JSON.stringify(stats, null, 2)}

Task priority: ${priority}

REQUIRED OUTPUT:
{
  "userId": "one of the allowed userIds",
  "name": "member name",
  "reason": "short explanation",
  "dueDate": "YYYY-MM-DD"
}
`;

    const result = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    let parsed;
    try {
      parsed = JSON.parse(result.choices[0].message.content);
    } catch {
      return res.status(500).json({
        message: 'AI returned invalid JSON',
        raw: result.choices[0].message.content,
      });
    }

    // Validate userId (prevents hallucination)
    if (!allowedUserIds.includes(parsed.userId)) {
      return res.status(400).json({
        message: 'Invalid userId returned by AI',
        returned: parsed.userId,
        allowed: allowedUserIds,
      });
    }

    // Success
    res.json(parsed);
  } catch (err) {
    console.log('AI assignee suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------
   3. AI Suggest Priority
------------------------------------------- */
router.post('/suggest-priority', auth, async (req, res) => {
  try {
    const { title, description } = req.body;

    const prompt = `
You are an AI that assigns task priority.

Rules:
- HIGH = urgent / deadlines / blockers
- MEDIUM = normal work
- LOW = optional / long timeline

User task:
- Title: ${title}
- Description: ${description}

Return ONLY JSON:
{
  "priority": "high | medium | low",
  "reason": "short explanation"
}
`;

    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    res.json(JSON.parse(completion.choices[0].message.content));
  } catch (err) {
    console.error('AI priority suggestion error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
