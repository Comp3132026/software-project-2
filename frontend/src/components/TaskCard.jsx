import { useState } from 'react';
import { Check, X, Edit2, AlertTriangle, Clock, Flag, Bell } from 'lucide-react';
import { tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { isOverdue } from '../hooks/filterTasks';
import ReminderModal from './ReminderModal';

export default function TaskCard({ task, onEdit, onUpdate, canEdit }) {
  const [showReminder, setShowReminder] = useState(false);

  const handleApprove = async (e) => {
    e.stopPropagation();
    try {
      await tasksAPI.complete(task._id);
      toast.success('Task completed!');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) {
      return;
    }
    try {
      await tasksAPI.delete(task._id);
      toast.success('Task deleted');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-surface-100 text-surface-300 border-surface-200';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'reject':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-surface-100 text-surface-300 border-surface-200';
    }
  };

  const overdue = isOverdue(task.dueDate);
  const isCompleted = task.status === 'completed';

  return (
    <>
      <div
        className={`card p-4 transition-all duration-200 ${
          isCompleted ? 'opacity-70' : ''
        } ${overdue && !isCompleted ? 'border-l-4 border-l-red-500' : ''}`}
      >
        <div className="flex items-start justify-between gap-4">
          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`font-semibold text-dark-800 ${
                  isCompleted ? 'line-through text-surface-300' : ''
                }`}
              >
                {task.title}
              </span>

              {canEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(task);
                  }}
                  className="p-1 text-surface-300 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Edit Task"
                >
                  <Edit2 size={14} />
                </button>
              )}

              {/* Reminder Button */}
              {!isCompleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReminder(true);
                  }}
                  className={`p-1 rounded-lg transition-colors ${
                    task.reminderSet
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      : 'text-surface-300 hover:text-blue-500 hover:bg-blue-50'
                  }`}
                  title={task.reminderSet ? 'Reminder set' : 'Set Reminder'}
                >
                  <Bell size={14} />
                </button>
              )}
            </div>

            {/* Assignees */}
            <p className="text-sm text-surface-300 mb-3">
              Assigned to: {task.assignedTo.map((u) => u.name).join(', ')}
            </p>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Status badge */}
              <span className={`badge border ${getStatusStyles(task.status)}`}>{task.status}</span>

              {/* Priority badge */}
              <span className={`badge border ${getPriorityStyles(task.priority)}`}>
                <Flag size={12} />
                {task.priority}
              </span>

              {/* Due date */}
              <span
                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  overdue && !isCompleted
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-sky-50 text-sky-600 border border-sky-200'
                }`}
              >
                <Clock size={12} />
                {task.dueDate?.split('T')[0]}
                {overdue && !isCompleted && <AlertTriangle size={12} />}
              </span>

              {/* Reminder indicator */}
              {task.reminderSet && (
                <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  <Bell size={12} />
                  Reminder
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && !isCompleted && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleApprove}
                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all"
                title="Complete Task"
              >
                <Check size={18} />
              </button>
              <button
                onClick={handleReject}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:scale-105 active:scale-95 transition-all"
                title="Delete Task"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Completed checkmark */}
          {isCompleted && (
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <Check size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminder && (
        <ReminderModal task={task} onClose={() => setShowReminder(false)} onSuccess={onUpdate} />
      )}
    </>
  );
}
