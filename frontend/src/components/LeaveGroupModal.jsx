import { useState } from 'react';
import { X, LogOut } from 'lucide-react';
import { groupsAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function LeaveGroupModal({ group, members, isOwner, onClose, onSuccess }) {

  // Stores selected member ID when owner must transfer ownership
  const [newOwnerId, setNewOwnerId] = useState('');

  // Loading state while API request is processing
  const [loading, setLoading] = useState(false);

  // Filter out the current owner from the list of potential new owners
  // Only non-owner members can be assigned ownership
  const eligibleMembers = members.filter((m) => m.role !== 'owner');

  // Handles the leave group action
  const handleLeave = async () => {

    // If the current user is the owner, they must assign a new owner first
    if (isOwner && !newOwnerId) {
      toast.error('Please select a new owner before leaving');
      return;
    }

    setLoading(true);

    try {
      // Call API to leave group
      // If owner, send newOwnerId to transfer ownership
      await groupsAPI.leave(group._id, isOwner ? { newOwnerId } : {});

      // Success notification
      toast.success('You have left the group');

      // Trigger success callback (redirect handled in parent)
      onSuccess?.();

    } catch (err) {
      // Show API error message if available
      toast.error(err.response?.data?.message || 'Failed to leave group');
    }

    setLoading(false);
  };

  return (
    // Modal overlay
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

      {/* Modal container */}
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">

        {/* Modal header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <LogOut size={20} />
            Leave Group
          </h3>

          {/* Close modal button */}
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Confirmation message */}
        <p className="text-gray-600 mb-4">
          Are you sure you want to leave "{group.name}"?
        </p>

        {/* MemS3.b requirement: Owner must assign a new owner before leaving */}
        {isOwner && (
          <div className="mb-4">

            <p className="text-sm text-orange-600 mb-2">
              As the owner, you must assign a new owner before leaving.
            </p>

            <label className="block text-sm font-medium mb-1">
              Select New Owner <span className="text-red-500">*</span>
            </label>

            {/* Dropdown list of eligible members */}
            <select
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select a member...</option>

              {eligibleMembers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>

            {/* Edge case: if owner is the only member */}
            {eligibleMembers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                No other members to transfer ownership to. You must add members first or delete the group.
              </p>
            )}

          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
          >
            Cancel
          </button>

          {/* Confirm leave button */}
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