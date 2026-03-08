import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { groupsAPI, tasksAPI, membersAPI } from '../utils/api';

export default function useGroupData(groupId) {
  const [group, setGroup] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [notifications] = useState([]);
  const [history] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [groupRes, tasksRes, membersRes] = await Promise.all([
        groupsAPI.getOne(groupId),
        tasksAPI.getByGroup(groupId),
        membersAPI.getByGroup(groupId),
      ]);

      setGroup(groupRes.data);
      setTasks(tasksRes.data);
      setMembers(membersRes.data);
    } catch (err) {
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (groupId) {
      loadAll();
    }
  }, [groupId]);

  return {
    group,
    tasks,
    members,
    notifications,
    history,
    loading,
    reloadAll: loadAll,
  };
}
