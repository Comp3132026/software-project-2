/**
 * @fileoverview Profile page component
 * @description Implements MemS1 (view member profiles with roles/contributions)
 * and MemS2 (edit own profile)
 */

import React, { useEffect, useState } from 'react';
import { authAPI, tasksAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import {
  User,
  Mail,
  Shield,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowLeft,
  Save,
  Calendar,
} from 'lucide-react';

/**
 * ProfilePage component for viewing and editing user profiles
 * @param {Object} props - Component props
 * @param {string} [props.memberId] - Optional member ID for viewing other profiles
 * @returns {JSX.Element} Profile page component
 */
const ProfilePage = ({ memberId: propMemberId }) => {
  const { user, setUser } = useAuth();
  const groupContext = useGroup();
  const members = groupContext?.members || null;
  const group = groupContext?.group || null;

  const { memberId: paramMemberId, groupId } = useParams();
  const memberId = propMemberId || paramMemberId;
  const navigate = useNavigate();

  const isViewingOther = Boolean(memberId);

  // Find the profile user from members list or use current user
  const profileMember = isViewingOther ? members?.find((m) => m.userId === memberId) : null;

  const profileUser = isViewingOther ? profileMember : user;
  const isSelf = !isViewingOther;

  // Form state
  const [name, setName] = useState(profileUser?.name || '');
  const [loading, setLoading] = useState(false);

  // Task statistics for MemS1
  const [taskStats, setTaskStats] = useState({
    assigned: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Fetch current user profile if viewing self
  useEffect(() => {
    if (!isSelf) {
      return;
    }
    (async () => {
      try {
        const res = await authAPI.getMe();
        setUser(res.data);
        setName(res.data.name);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    })();
  }, [isSelf, setUser]);

  // Fetch task statistics for MemS1 - contributions view
  useEffect(() => {
    if (!groupId || !profileUser) {
      return;
    }

    const fetchTaskStats = async () => {
      setStatsLoading(true);
      try {
        const userId = isViewingOther ? memberId : user?._id;
        const res = await tasksAPI.getByGroup(groupId);
        const tasks = res.data || [];

        // Calculate stats for this user
        const userTasks = tasks.filter((task) =>
          task.assignedTo?.some((assignee) => (assignee._id || assignee) === userId)
        );

        const completedTasks = userTasks.filter((task) => task.status === 'completed');
        const pendingTasks = userTasks.filter((task) => task.status !== 'completed');

        const rate =
          userTasks.length > 0 ? Math.round((completedTasks.length / userTasks.length) * 100) : 0;

        setTaskStats({
          assigned: userTasks.length,
          completed: completedTasks.length,
          pending: pendingTasks.length,
          completionRate: rate,
        });
      } catch (err) {
        console.error('Failed to fetch task stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchTaskStats();
  }, [groupId, memberId, isViewingOther, user?._id, profileUser]);

  // MemS2: Save profile changes
  const handleSave = async () => {
    if (!isSelf) {
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.updateMe({ name });
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Profile updated!');
      navigate(-1);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Get role display info
  const getRoleInfo = (role) => {
    switch (role) {
      case 'owner':
        return { label: 'Owner', color: 'text-amber-600 bg-amber-50 border-amber-200' };
      case 'moderator':
        return { label: 'Moderator', color: 'text-primary-600 bg-primary-50 border-primary-200' };
      case 'member':
        return { label: 'Member', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'viewer':
        return { label: 'Viewer', color: 'text-gray-600 bg-gray-50 border-gray-200' };
      default:
        return { label: 'Unknown', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-surface-300">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roleInfo = profileMember ? getRoleInfo(profileMember.role) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 to-primary-50/30 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-surface-300" />
          </button>
          <h1 className="font-display font-bold text-2xl text-dark-800">
            {isSelf ? 'Your Profile' : 'Member Profile'}
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-surface-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8 text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-bold text-white">
                {profileUser.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{profileUser.name}</h2>
            <p className="text-white/70 text-sm mt-1">{profileUser.email}</p>

            {/* Role Badge - MemS1 requirement */}
            {roleInfo && (
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${roleInfo.color}`}
                >
                  <Shield size={14} />
                  {roleInfo.label}
                </span>
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="p-6 space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-dark-800 flex items-center gap-2">
                <User size={18} className="text-primary-500" />
                Basic Information
              </h3>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Name</label>
                {isSelf ? (
                  <input
                    type="text"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                  />
                ) : (
                  <div className="px-4 py-3 bg-surface-50 rounded-xl text-dark-800">
                    {profileUser.name}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
                <div className="px-4 py-3 bg-surface-50 rounded-xl text-dark-800 flex items-center gap-2">
                  <Mail size={16} className="text-surface-300" />
                  {profileUser.email}
                </div>
              </div>

              {/* Join Date - if viewing member */}
              {profileMember?.joinedAt && (
                <div>
                  <label className="block text-sm font-medium text-surface-300 mb-1.5">
                    Joined Group
                  </label>
                  <div className="px-4 py-3 bg-surface-50 rounded-xl text-dark-800 flex items-center gap-2">
                    <Calendar size={16} className="text-surface-300" />
                    {new Date(profileMember.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* Task Contributions Section - MemS1 requirement */}
            {groupId && (
              <div className="space-y-4 pt-4 border-t border-surface-100">
                <h3 className="font-semibold text-dark-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-primary-500" />
                  Contributions in {group?.name || 'Group'}
                </h3>

                {statsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {/* Assigned Tasks */}
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Clock size={20} className="text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{taskStats.assigned}</p>
                      <p className="text-xs text-blue-600/70">Assigned Tasks</p>
                    </div>

                    {/* Completed Tasks */}
                    <div className="bg-emerald-50 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <CheckCircle size={20} className="text-emerald-600" />
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">{taskStats.completed}</p>
                      <p className="text-xs text-emerald-600/70">Completed</p>
                    </div>

                    {/* Pending Tasks */}
                    <div className="bg-amber-50 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Clock size={20} className="text-amber-600" />
                      </div>
                      <p className="text-2xl font-bold text-amber-600">{taskStats.pending}</p>
                      <p className="text-xs text-amber-600/70">Pending</p>
                    </div>

                    {/* Completion Rate */}
                    <div className="bg-primary-50 rounded-xl p-4 text-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <TrendingUp size={20} className="text-primary-600" />
                      </div>
                      <p className="text-2xl font-bold text-primary-600">
                        {taskStats.completionRate}%
                      </p>
                      <p className="text-xs text-primary-600/70">Completion Rate</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Badge - if viewing member */}
            {profileMember?.status && (
              <div className="pt-4 border-t border-surface-100">
                <h3 className="font-semibold text-dark-800 mb-3">Member Status</h3>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium capitalize
                    ${profileMember.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : ''}
                    ${profileMember.status === 'inactive' ? 'bg-amber-50 text-amber-700 border border-amber-200' : ''}
                    ${profileMember.status === 'unresponsive' ? 'bg-red-50 text-red-700 border border-red-200' : ''}
                  `}
                >
                  {profileMember.status}
                </span>
                {profileMember.isSuspended && (
                  <span className="ml-2 inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-700 border border-red-200">
                    Suspended
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {isSelf && (
            <div className="px-6 py-4 bg-surface-50 border-t border-surface-100 flex justify-end gap-3">
              <button onClick={() => navigate(-1)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
