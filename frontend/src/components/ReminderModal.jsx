/**
 * ReminderModal Component
 * Allows users to set reminders for tasks
 */

import { useState } from 'react';
import { X, Bell, Clock, Calendar } from 'lucide-react';
import { notificationsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ReminderModal({ task, onClose, onSuccess }) {
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderMessage, setReminderMessage] = useState(`Reminder: ${task?.title || ''}`);
  const [loading, setLoading] = useState(false);

  // Quick preset options
  const presets = [
    { label: 'In 1 hour', hours: 1 },
    { label: 'Tomorrow 9 AM', days: 1, time: '09:00' },
    { label: 'In 3 days', days: 3 },
    { label: 'In 1 week', days: 7 },
  ];

  const applyPreset = (preset) => {
    const now = new Date();

    if (preset.hours) {
      now.setHours(now.getHours() + preset.hours);
    } else if (preset.days) {
      now.setDate(now.getDate() + preset.days);
      if (preset.time) {
        const [hours, minutes] = preset.time.split(':');
        now.setHours(parseInt(hours), parseInt(minutes));
      }
    }

    setReminderDate(now.toISOString().split('T')[0]);
    setReminderTime(now.toTimeString().slice(0, 5));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reminderDate) {
      toast.error('Please select a date');
      return;
    }

    const dateTime = new Date(`${reminderDate}T${reminderTime}`);

    if (dateTime <= new Date()) {
      toast.error('Reminder must be in the future');
      return;
    }

    setLoading(true);
    try {
      await notificationsAPI.setReminder(task._id, {
        reminderDate: dateTime.toISOString(),
        reminderMessage,
      });
      toast.success('Reminder set successfully!');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set reminder');
    }
    setLoading(false);
  };

  // Get min date (today)
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Set Reminder</h2>
                <p className="text-white/80 text-sm truncate max-w-[200px]">{task?.title}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Quick Presets */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Options</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={14} className="inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                min={minDate}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={14} className="inline mr-1" />
                Time
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Custom Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Message (optional)
            </label>
            <input
              type="text"
              value={reminderMessage}
              onChange={(e) => setReminderMessage(e.target.value)}
              placeholder="Custom reminder message..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              maxLength={200}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> You&apos;ll receive a notification at the scheduled time.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reminderDate}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Bell size={18} />
                  Set Reminder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
