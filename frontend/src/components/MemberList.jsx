import { useMemberActions } from '../hooks/useMemberActions';
import { useState } from 'react';
import {
  Flag,
  AlertTriangle,
  X,
  Search,
  UserPlus,
  Users,
  Shield,
  Eye,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MemberList({ groupId, members, isOwner, canManageMembers, onUpdate }) {
  const {
    showAdd,
    setShowAdd,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    showRoleSelect,
    setShowRoleSelect,
    searchFriends,
    handleAddMember,
    handleRoleChange,
    handleSuspend,
    handleRemove,
    handleFlag,
  } = useMemberActions(groupId, onUpdate);

  const [flagMenu, setFlagMenu] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentUser = members.find((m) => m.userId === user._id);
  const isGroupMod = currentUser?.role === 'owner' || currentUser?.role === 'moderator';

  // Check if current user can manage a specific member
  const canManageMember = (member) => {
    if (!canManageMembers) {
      return false;
    }
    if (member.role === 'owner') {
      return false;
    } // Can't manage owner
    if (isOwner) {
      return true;
    } // Owner can manage anyone except other owners
    // Moderator can only manage members and viewers, not other moderators
    if (currentUser?.role === 'moderator' && member.role === 'moderator') {
      return false;
    }
    return true;
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Shield size={12} className="text-amber-500" />;
      case 'moderator':
        return <Shield size={12} className="text-primary-500" />;
      case 'viewer':
        return <Eye size={12} className="text-surface-300" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'inactive':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'unresponsive':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-surface-100 text-surface-300 border-surface-200';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary-600" />
          <h3 className="font-display font-bold text-lg text-dark-800">Members</h3>
          <span className="text-xs bg-surface-100 text-surface-300 px-2 py-0.5 rounded-full">
            {members.length}
          </span>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className={`btn-ghost text-sm ${showAdd ? 'bg-primary-50 text-primary-600' : ''}`}
          >
            <UserPlus size={16} />
            Add Member
          </button>
        )}
      </div>

      {/* Search bar with friend list */}
      {showAdd && (
        <div className="mb-4 p-4 bg-surface-50 rounded-xl animate-slide-down">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" />
              <input
                type="text"
                placeholder="Search friends to add..."
                className="input-field pl-10 py-2.5 text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchFriends(e.target.value);
                }}
                autoFocus
              />
            </div>
            <button
              onClick={() => setShowAdd(false)}
              className="p-2 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <X size={18} className="text-surface-300" />
            </button>
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
                  className="flex items-center justify-between bg-white p-3 rounded-xl border border-surface-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-dark-800">{u.name}</span>
                  </div>
                  <button
                    onClick={() => handleAddMember(u._id)}
                    className="btn-primary py-1.5 px-3 text-sm"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !searching && (
            <p className="text-xs text-surface-300 text-center py-3">No friends found</p>
          )}
        </div>
      )}

      {/* Member list */}
      <div className="space-y-2">
        {members.map((m) => (
          <div
            key={m._id}
            className="group flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-all cursor-pointer"
            onClick={() => navigate(`/group/${groupId}/member/profile/${m.userId}`)}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  m.isSuspended ? 'bg-red-100' : 'bg-gradient-to-br from-primary-400 to-primary-600'
                }`}
              >
                <span
                  className={`text-sm font-bold ${m.isSuspended ? 'text-red-500' : 'text-white'}`}
                >
                  {m.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name & Role */}
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium text-dark-800 ${m.isSuspended ? 'opacity-50' : ''}`}
                  >
                    {m.name}
                  </span>
                  {getRoleIcon(m.role)}
                  <span className="text-xs text-surface-300">({m.role})</span>
                </div>

                {/* Status badges */}
                <div className="flex items-center gap-2 mt-1">
                  {m.isSuspended ? (
                    <span className="badge-danger text-xs">Suspended</span>
                  ) : (
                    <span className={`badge border text-xs ${getStatusColor(m.status)}`}>
                      {m.status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Flag button for mods */}
              {isGroupMod && !m.isSuspended && m.role !== 'owner' && (
                <div className="relative">
                  <button
                    className="p-2 hover:bg-white rounded-lg text-surface-300 hover:text-primary-500 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlagMenu(flagMenu === m._id ? null : m._id);
                    }}
                  >
                    <Flag size={14} />
                  </button>

                  {flagMenu === m._id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-surface-100 z-50 overflow-hidden animate-scale-in">
                      {['active', 'inactive', 'unresponsive'].map((status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlag(m._id, status);
                            setFlagMenu(null);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface-50 capitalize ${
                            m.status === status
                              ? 'bg-primary-50 text-primary-600 font-medium'
                              : 'text-dark-800'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Member management actions - Owner and Moderator (with restrictions) */}
              {canManageMember(m) && (
                <>
                  {/* Suspend button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSuspend(m.userId);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      m.isSuspended
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                    }`}
                    title={m.isSuspended ? 'Unsuspend' : 'Suspend'}
                  >
                    <AlertTriangle size={14} />
                  </button>

                  {/* Role dropdown - Only Owner can change roles */}
                  {isOwner && (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRoleSelect(showRoleSelect === m._id ? null : m._id);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Role
                        <ChevronDown size={12} />
                      </button>

                      {showRoleSelect === m._id && (
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-surface-100 z-50 overflow-hidden animate-scale-in">
                          {['moderator', 'member', 'viewer'].map((role) => (
                            <button
                              key={role}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoleChange(m.userId, role);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm hover:bg-surface-50 capitalize ${
                                m.role === role
                                  ? 'bg-primary-50 text-primary-600 font-medium'
                                  : 'text-dark-800'
                              }`}
                            >
                              {role}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(m.userId, m.name);
                    }}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    title="Remove member"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
