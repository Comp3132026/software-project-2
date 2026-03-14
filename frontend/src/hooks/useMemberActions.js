import { useState } from 'react';
import toast from 'react-hot-toast';
import { membersAPI } from '../utils/api';

export function useMemberActions(groupId, onUpdate) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showRoleSelect, setShowRoleSelect] = useState(null);

  // Search users
  const searchFriends = async (q) => {
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await membersAPI.search(q, groupId);
      setSearchResults(res.data);
    } catch {
      /* Silent fail */
    }
    setSearching(false);
  };

  // Add member
  const handleAddMember = async (userId) => {
    try {
      await membersAPI.add(groupId, { userId, role: 'member' });
      toast.success('Member added!');
      setShowAdd(false);
      setSearchQuery('');
      setSearchResults([]);
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  // Change role
  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await membersAPI.updateRole(groupId, userId, {
        role: newRole,
      });

      console.log('role response', res.data);
      toast.success('Role updated!');
      setShowRoleSelect(null);
      onUpdate?.();
    } catch (err) {
      console.log('ERROR RESPONSE:', err);
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  // Suspend
  const handleSuspend = async (userId) => {
    try {
      await membersAPI.suspend(groupId, userId);
      toast.success('Member status updated');
      onUpdate?.();
    } catch (err) {
      console.log(err);
      toast.error('Suspend Failed');
    }
  };

  // Remove
  const handleRemove = async (userId, name) => {
    if (!window.confirm(`Remove ${name} from the group?`)) {
      return;
    }
    try {
      await membersAPI.remove(groupId, userId);
      toast.success('Member removed');
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  //flag
  const handleFlag = async (memberId, flagType) => {
    console.log('Sending memberId =', memberId);
    try {
      await membersAPI.flag(groupId, memberId, { flag: flagType });
      onUpdate(); // refresh list
      toast.success('Member flagged');
    } catch (err) {
      console.log(err);
      toast.error('Failed to flag member');
    }
  };

  return {
    // state
    showAdd,
    setShowAdd,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    showRoleSelect,
    setShowRoleSelect,

    // actions
    searchFriends,
    handleAddMember,
    handleRoleChange,
    handleSuspend,
    handleRemove,
    handleFlag,
  };
}
