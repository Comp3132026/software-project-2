import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Calendar, Flag, Users, RefreshCw } from 'lucide-react';
import { tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useAI } from '../hooks/useAI';
import AIHintBubbleStack from '../components/AIHintBubble';

export default function TaskForm({ groupId, task, members, onClose, onSuccess }) {
  const { loading: _aiLoading, suggestTaskDetails, suggestAssignee, suggestPriority } = useAI();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    assignedTo: [],
    isHabit: false,
    frequency: 'once',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const typingTimer = useRef(null);

  // AI hint bubbles
  const [aiReason, setAiReason] = useState({
    priority: '',
    dueDate: '',
    assignee: '',
  });

  const [aiSuggestedText, setAiSuggestedText] = useState(false);

  // Load existing task (edit mode)
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        priority: task.priority || 'medium',
        assignedTo: task.assignedTo?.map((a) => a._id) || [],
        isHabit: task.isHabit || false,
        frequency: task.frequency || 'once',
      });
    }
  }, [task]);

  // Auto-select owner for NEW tasks
  useEffect(() => {
    if (!task && members.length > 0) {
      const owner = members.find((m) => m.role === 'owner');
      if (owner) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: prev.assignedTo.length ? prev.assignedTo : [owner._id],
        }));
      }
    }
  }, [members, task]);

  // AUTO PRIORITY (title/description changes)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!formData.title.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      autoPriority();
    }, 600);

    return () => clearTimeout(timer);
  }, [formData.title, formData.description]);

  const autoPriority = async () => {
    try {
      const ai = await suggestPriority({
        title: formData.title,
        description: formData.description,
      });

      setFormData((prev) => ({
        ...prev,
        priority: ai.priority,
      }));

      setAiReason((prev) => ({
        ...prev,
        priority: ai.reason,
      }));
    } catch {
      /* Silent fail */
    }
  };

  // AUTO IMPROVE TITLE + DESCRIPTION
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!formData.title.trim() && !formData.description.trim()) {
      return;
    }

    clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      autoSuggestTaskDetails();
    }, 700);

    return () => clearTimeout(typingTimer.current);
  }, [formData.title, formData.description]);

  const autoSuggestTaskDetails = async () => {
    if (aiSuggestedText) {
      return;
    }

    try {
      const data = await suggestTaskDetails({
        title: formData.title,
        description: formData.description,
      });

      setFormData((prev) => ({
        ...prev,
        title: data.title,
        description: data.description,
      }));

      setAiSuggestedText(true);
      toast.success('AI improved your task ✨');
    } catch {
      /* Silent fail */
    }
  };

  // AUTO ASSIGNEE + DUE DATE
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!members || members.length === 0) {
      return;
    }
    if (task) {
      return;
    }
    autoSuggestAssignee();
  }, [formData.priority, members]);

  const autoSuggestAssignee = async () => {
    try {
      const ai = await suggestAssignee({
        groupId,
        priority: formData.priority,
      });

      setFormData((prev) => ({
        ...prev,
        assignedTo: [ai.userId],
        dueDate: ai.dueDate,
      }));

      setAiReason((prev) => ({
        ...prev,
        assignee: ai.reason,
        dueDate: `AI suggests due date: ${ai.dueDate}`,
      }));

      toast.success(`AI assigned ${ai.name}`);
    } catch {
      /* Silent fail */
    }
  };

  // VALIDATION
  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 2) {
      newErrors.title = 'Title must be at least 2 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMIT TASK
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        groupId,
        dueDate: formData.dueDate || null,
      };

      if (task) {
        await tasksAPI.update(task._id, data);
        toast.success('Task updated!');
      } else {
        await tasksAPI.create(data);
        toast.success('Task created!');
      }
      onSuccess?.();
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || 'Failed to save task');
    }
    setLoading(false);
  };

  const handleAssigneeToggle = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(userId)
        ? prev.assignedTo.filter((id) => id !== userId)
        : [...prev.assignedTo, userId],
    }));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      default:
        return 'text-surface-300 bg-surface-50 border-surface-200';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content p-0" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-display font-bold text-xl text-dark-800">
              {task ? 'Edit Task' : 'Add Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-surface-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-dark-800">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`input-field ${errors.title ? 'border-red-300 focus:ring-red-500/30 focus:border-red-400' : ''}`}
              placeholder="What needs to be done?"
              required
            />
            {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-dark-800">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-field resize-none"
              rows={3}
              placeholder="Add more details..."
            />
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                <Calendar size={14} />
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                <Flag size={14} />
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={`input-field ${getPriorityColor(formData.priority)}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Assign To */}
          {members.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-dark-800">
                <Users size={14} />
                Assign To
              </label>
              <div className="border border-surface-200 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-1">
                {members.map((m) => (
                  <label
                    key={m._id}
                    className="flex items-center gap-3 p-2 hover:bg-surface-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedTo.includes(m.userId)}
                      onChange={() => handleAssigneeToggle(m.userId)}
                      className="w-4 h-4 text-primary-600 border-surface-200 rounded focus:ring-primary-500"
                    />
                    <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-dark-800">{m.name}</span>
                    <span className="text-xs text-surface-300 bg-surface-100 px-2 py-0.5 rounded-full">
                      {m.role}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Habit Toggle */}
          <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
            <div className="flex items-center gap-3">
              <RefreshCw size={18} className="text-primary-600" />
              <div>
                <p className="text-sm font-semibold text-dark-800">Recurring Habit</p>
                <p className="text-xs text-surface-300">Repeat this task on a schedule</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isHabit}
                onChange={(e) => setFormData({ ...formData, isHabit: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-surface-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Habit Frequency */}
          {formData.isHabit && (
            <div className="space-y-2 animate-slide-down">
              <label className="block text-sm font-semibold text-dark-800">Frequency</label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="input-field"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>

            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Saving...
                </span>
              ) : task ? (
                'Save Changes'
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>

        {/* FLOATING AI BUBBLES */}
        <AIHintBubbleStack reasons={[aiReason.dueDate, aiReason.priority, aiReason.assignee]} />
      </div>
    </div>
  );
}
