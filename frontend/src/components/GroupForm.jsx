import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { groupsAPI } from '../utils/api';
import toast from 'react-hot-toast';

const categories = ['Health', 'Fitness', 'Productivity', 'Learning', 'Finance', 'Social', 'Other'];

export default function GroupForm({ group, onClose, onSuccess, isEditMode: _isEditMode = false }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // If isEditMode is true but no group, don't render (safeguard)

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        category: group.category || 'Other',
      });
    }
  }, [group]);

  // Client-side validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name cannot exceed 100 characters';
    }
    if (formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      if (group && group._id) {
        //Update group
        await groupsAPI.update(group._id, formData);
        toast.success('Group updated successfully!');
      } else {
        //Create group
        await groupsAPI.create(formData);
        toast.success('Group created successfully!');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save group');
    }
    setLoading(false);
  };

  // Determine title based on actual group data, not just isEditMode
  const title = group && group._id ? 'Edit Group' : 'Create New Group';
  const submitText = group && group._id ? 'Save Changes' : 'Create Group';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/*Name field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full border rounded px-3 py-2 ${errors.name ? 'border-red-500' : ''}`}
              placeholder="Enter group name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/*Description field */}
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full border rounded px-3 py-2 ${
                errors.description ? 'border-red-500' : ''
              }`}
              rows={4}
              placeholder="Describe your group..."
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/500</p>
          </div>

          {/*Category field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/*Save/Cancel buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
