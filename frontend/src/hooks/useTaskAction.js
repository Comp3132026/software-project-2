import { useState } from 'react';

export default function useTaskActions({ loadData }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleTaskFormClose = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleTaskFormSuccess = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    loadData();
  };

  return {
    showTaskForm,
    editingTask,
    setEditingTask,
    setShowTaskForm,
    handleEditTask,
    handleTaskFormClose,
    handleTaskFormSuccess,
  };
}
