import { useState } from 'react';
import { X, LogOut } from 'lucide-react';
import { groupsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function LeaveGroupModal({ group, members = [], isOwner, onClose, onSuccess }) {
  const [newOwnerId, setNewOwnerId] = useState('');
  const [loading, setLoading] = useState(false);

  // Use actual user IDs, not membership IDs
  const eligibleMembers = members.filter((m) => m.role !== 'owner');

  const handleLeave = async () => {
    if (isOwner) {
      if (eligibleMembers.length === 0) {
        toast.error('No eligible member available for ownership transfer.');
        return;
      }

      if (!newOwnerId) {
        toast.error('Please select a new owner before leaving.');
        return;
      }
    }

    setLoading(true);

    try {
      // Step 1: transfer ownership first if current user is owner
      if (isOwner) {
        await groupsAPI.transferOwnership(group._id, {
          newOwnerId,
        });
      }

      // Step 2: then leave group
      await groupsAPI.leave(group._id, {});

      toast.success('You have left the group');
      onSuccess?.();
    } catch (err) {
      console.error('Leave group error:', err);
      toast.error(err.response?.data?.message || 'Failed to leave group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <LogOut size={20} />
            Leave Group
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Are you sure you want to leave &quot;{group.name}&quot;?
        </p>

        {isOwner && (
          <div className="mb-4">
            <p className="text-sm text-orange-600 mb-2">
              As the owner, you must assign a new owner before leaving.
            </p>

            <label className="block text-sm font-medium mb-1">
              Select New Owner <span className="text-red-500">*</span>
            </label>

            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a member...</option>
              {eligibleMembers.map((m) => (
                <option key={m.userId || m._id} value={m.userId || m._id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>

            {eligibleMembers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No other members to transfer ownership to. You must add members first or delete the
                group.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleLeave}
            disabled={loading || (isOwner && !newOwnerId)}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Leaving...' : 'Leave Group'}
          </button>
        </div>
      </div>
    </div>
  );
}