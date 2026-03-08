import { useState } from 'react';
import { aiAPI } from '../utils/api';
import toast from 'react-hot-toast';

export const useAI = () => {
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------
  // AI Suggest Task Details (title + description)
  // ------------------------------------------------------
  const suggestTaskDetails = async (payload) => {
    try {
      setLoading(true);
      const res = await aiAPI.suggestTask(payload);
      return res.data;
    } catch (err) {
      console.error('AI Suggest Task Error:', err);
      toast.error(err.response?.data?.message || 'AI failed to suggest task details.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // AI Suggest Assignee + Due Date
  // ------------------------------------------------------
  const suggestAssignee = async ({ groupId, priority }) => {
    try {
      setLoading(true);
      const res = await aiAPI.suggestAssignee({ groupId, priority });
      return res.data;
    } catch (err) {
      console.error('AI Suggest Assignee Error:', err);
      toast.error(err.response?.data?.message || 'AI failed to suggest assignee.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------
  // AI Suggest Priority
  // ------------------------------------------------------
  const suggestPriority = async ({ title, description }) => {
    try {
      setLoading(true);
      const res = await aiAPI.suggestPriority({ title, description });
      return res.data;
    } catch (err) {
      console.error('AI Priority Error:', err);
      toast.error(err.response?.data?.message || 'AI failed to suggest priority.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    suggestTaskDetails,
    suggestAssignee,
    suggestPriority,
  };
};
