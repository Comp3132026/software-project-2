import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Sparkles, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { groupsAPI } from '../utils/api';
import Header from '../components/Header';
import FriendsPanel from '../components/FriendsPanel';
import GroupCard from '../components/GroupCard';
import GroupForm from '../components/GroupForm';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinGroupName, setJoinGroupName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      setGroups(res.data);
    } catch {
      /* Silent fail */
    }
    setLoading(false);
  };

  const handleJoinGroup = async () => {
    if (!joinGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    setJoining(true);
    try {
      await groupsAPI.join({ groupName: joinGroupName });
      toast.success('Joined group successfully!');
      setShowJoinModal(false);
      setJoinGroupName('');
      loadGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join group');
    }
    setJoining(false);
  };

  // Show landing page for non-authenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-surface-50 via-primary-50/30 to-surface-50">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary-500/30 animate-float">
              <Sparkles className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-bold text-dark-800 mb-6">
              Welcome to <span className="gradient-text">LifeSync</span>
            </h1>

            <p className="text-xl text-surface-300 mb-10 max-w-lg mx-auto">
              Manage your groups, track habits, and achieve your goals together with your team.
              Start your productivity journey today.
            </p>

            <button onClick={() => navigate('/login')} className="btn-primary text-lg px-8 py-4">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-dark-800 mb-1">Your Groups</h1>
                <p className="text-surface-300">Manage and track progress across all your groups</p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setShowJoinModal(true)} className="btn-ghost">
                  <UserPlus size={18} />
                  Join Group
                </button>
                <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                  <Plus size={18} />
                  Create Group
                </button>
              </div>
            </div>

            {/* Groups Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-28 h-28 bg-surface-100 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-surface-100 rounded w-3/4" />
                        <div className="h-4 bg-surface-100 rounded w-1/2" />
                        <div className="h-4 bg-surface-100 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : groups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group, index) => (
                  <div
                    key={group._id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <GroupCard group={group} completionRate={group.completionRate} />
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="card p-12 text-center animate-fade-in">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-dark-800 mb-2">No groups yet</h3>
                <p className="text-surface-300 mb-6 max-w-sm mx-auto">
                  Create your first group to start tracking habits and tasks with your team
                </p>
                <button onClick={() => setShowCreateForm(true)} className="btn-primary">
                  <Plus size={18} />
                  Create Your First Group
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Friends Panel */}
        <FriendsPanel />
      </div>

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-dark-800">Join a Group</h3>
            </div>

            <div className="space-y-2 mb-6">
              <label className="block text-sm font-semibold text-dark-800">Group Name</label>
              <input
                type="text"
                value={joinGroupName}
                onChange={(e) => setJoinGroupName(e.target.value)}
                placeholder="Enter the group name"
                className="input-field"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinGroup()}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinGroupName('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleJoinGroup} disabled={joining} className="btn-primary flex-1">
                {joining ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Form */}
      {showCreateForm && (
        <GroupForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadGroups();
          }}
        />
      )}
    </div>
  );
}

