// src/components/HomeProfileCard.jsx
import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HomeProfileCard() {
  const { user } = useAuth();
  if (!user) {
    return null;
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
          {initial}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
          <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
            <User size={12} />
            <span>Logged in as group member</span>
          </div>
        </div>
      </div>
    </div>
  );
}
