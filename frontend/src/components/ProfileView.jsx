// src/components/ProfileView.jsx
import { useEffect, useState } from 'react';
import { X, User, Award, ListChecks, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { profileAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function ProfileView({ userId, groupId, isOwnProfile, onClose }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [membership, setMembership] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !groupId) {
      return;
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, groupId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileAPI.getProfile(groupId, userId);
      const data = res.data || res;
      setProfile(data.profile);
      setMembership(data.membership);
      setContributions(data.contributions);
      setRecentTasks(data.recentTasks || []);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.message || 'Failed to load member profile.');
      toast.error(err.response?.data?.message || 'Failed to load member profile.');
    }
    setLoading(false);
  };

  const roleLabel = membership?.role
    ? membership.role.charAt(0).toUpperCase() + membership.role.slice(1)
    : 'Member';

  const formatDate = (d) => {
    if (!d) {
      return '—';
    }
    return new Date(d).toLocaleDateString();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {profile?.name?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="font-semibold text-lg">
                {isOwnProfile ? 'My Profile' : 'Member Profile'}
              </h2>
              <p className="text-xs text-gray-500">
                View {isOwnProfile ? 'your' : 'this member’s'} role and contributions in this group.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading profile…</p>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Basic info + role */}
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {profile?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{profile?.name}</h3>
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      <Award size={12} />
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined group:{' '}
                    <span className="font-medium text-gray-600">
                      {formatDate(membership?.joinDate)}
                    </span>{' '}
                    • Status:{' '}
                    <span className="font-medium text-gray-600">
                      {membership?.status || 'active'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Contributions summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <ListChecks size={14} />
                    <span>Assigned tasks</span>
                  </div>
                  <p className="text-lg font-semibold">{contributions?.assignedCount ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CheckCircle2 size={14} />
                    <span>Completed</span>
                  </div>
                  <p className="text-lg font-semibold">{contributions?.completedCount ?? 0}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {contributions?.completionRate ?? 0}% completion
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Clock size={14} />
                    <span>Pending</span>
                  </div>
                  <p className="text-lg font-semibold">{contributions?.pendingCount ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <User size={14} />
                    <span>Created tasks</span>
                  </div>
                  <p className="text-lg font-semibold">{contributions?.createdCount ?? 0}</p>
                </div>
              </div>

              {/* Recent tasks list */}
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <ListChecks size={14} />
                  Recent tasks & habits
                </h4>
                {recentTasks.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No recent tasks found for this member in this group.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentTasks.map((t) => (
                      <div
                        key={t._id}
                        className="border rounded-lg px-3 py-2 text-xs flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{t.title}</p>
                          <p className="text-[11px] text-gray-500">
                            {t.type} • {t.status}
                          </p>
                        </div>
                        <div className="text-right text-[11px] text-gray-400">
                          <div>{t.dueDate ? `Due ${formatDate(t.dueDate)}` : ''}</div>
                          <div>{t.createdAt ? `Created ${formatDate(t.createdAt)}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
