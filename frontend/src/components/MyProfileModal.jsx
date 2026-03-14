import { useAuth } from '../context/AuthContext';
import { X, User } from 'lucide-react';

export default function MyProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();

  if (!isOpen || !user) {
    return null;
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {initial}
            </div>
            <div>
              <h2 className="font-semibold text-lg">My Profile</h2>
              <p className="text-xs text-gray-500">Your account details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3 text-sm">
          <div>
            <span className="block text-xs text-gray-500 uppercase mb-1">Name</span>
            <span className="font-medium">{user.name}</span>
          </div>

          <div>
            <span className="block text-xs text-gray-500 uppercase mb-1">Email</span>
            <span className="font-medium">{user.email}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <User size={14} />
            <span>User ID: {user._id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
