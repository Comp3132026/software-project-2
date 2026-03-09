import { useState, useEffect } from 'react';
import { Plus, X, Search, Users, UserPlus } from 'lucide-react';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function FriendsPanel() {
  const [friends, setFriends] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const res = await authAPI.getFriends();
      setFriends(res.data);
    } catch {
      /* Silent fail */
    }
  };

  const searchUsers = async (q) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await authAPI.searchUsers(q);
      // Filter out existing friends
      const friendIds = friends.map((f) => f._id);
      setSearchResults(res.data.filter((u) => !friendIds.includes(u._id)));
    } catch {
      /* Silent fail */
    }
    setSearching(false);
  };

  const addFriend = async (userId) => {
    try {
      await authAPI.addFriend(userId);
      toast.success('Friend added!');
      loadFriends();
      setShowAdd(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (e) {
      console.log('ADD FRIEND ERROR RESPONSE:', e);
      toast.error(e.response?.data?.message || 'Failed to add friend');
    }
  };

  const removeFriend = async (userId) => {
    try {
      await authAPI.removeFriend(userId);
      toast.success('Friend removed!');
      loadFriends();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove friend');
    }
  };

  return (
    <div className="w-64 min-h-full bg-white border-l border-surface-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary-600" />
          <h3 className="font-display font-bold text-dark-800">Friends</h3>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`p-2 rounded-xl transition-all ${
            showAdd
              ? 'bg-primary-50 text-primary-600 rotate-45'
              : 'hover:bg-surface-100 text-surface-300 hover:text-dark-800'
          }`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Search Section */}
      {showAdd && (
        <div className="mb-5 animate-slide-down">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
            <input
              type="text"
              placeholder="Search users..."
              className="input-field pl-10 py-2.5 text-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              autoFocus
            />
          </div>

          {searching && (
            <p className="text-xs text-surface-300 flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching...
            </p>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between bg-surface-50 p-3 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-600">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-dark-800 truncate">{u.name}</span>
                  </div>
                  <button
                    onClick={() => addFriend(u._id)}
                    className="p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <p className="text-xs text-surface-300 text-center py-3">No users found</p>
          )}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-2">
        {friends.map((f) => (
          <div
            key={f._id}
            className="group flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">
                  {f.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-dark-800 truncate">{f.name}</span>
            </div>

            <button
              onClick={() => removeFriend(f._id)}
              className="p-1.5 text-black hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {friends.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-surface-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-surface-300" />
            </div>
            <p className="text-sm text-surface-300">No friends yet</p>
            <p className="text-xs text-surface-200 mt-1">Click + to add friends</p>
          </div>
        )}
      </div>
    </div>
  );
}