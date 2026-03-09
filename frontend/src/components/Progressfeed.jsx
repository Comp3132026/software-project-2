import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Heart,
  MessageCircle,
  Send,
  X,
  Award,
  Target,
  Lightbulb,
  Trash2,
} from 'lucide-react';
import { progressAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProgressFeed({ groupId, onClose }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProgress, setNewProgress] = useState({
    title: '',
    description: '',
    type: 'update',
  });
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    loadProgress();
  }, [groupId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const res = await progressAPI.getByGroup(groupId);
      setProgress(res.data.progress || res.data);
    } catch (err) {
      toast.error('Failed to load progress updates');
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newProgress.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      await progressAPI.create(groupId, newProgress);
      toast.success('Progress shared!');
      setShowCreateForm(false);
      setNewProgress({ title: '', description: '', type: 'update' });
      loadProgress();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share progress');
    }
  };

  const handleLike = async (progressId) => {
    try {
      await progressAPI.toggleLike(progressId);
      loadProgress();
    } catch (err) {
      toast.error('Failed to like');
    }
  };

  const handleComment = async (progressId) => {
    const text = commentText[progressId];
    if (!text?.trim()) {
      return;
    }

    try {
      await progressAPI.addComment(progressId, { content: text });
      setCommentText({ ...commentText, [progressId]: '' });
      loadProgress();
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDelete = async (progressId) => {
    if (!confirm('Delete this progress update?')) {
      return;
    }

    try {
      await progressAPI.delete(progressId);
      toast.success('Progress deleted');
      loadProgress();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'achievement':
        return <Award className="text-yellow-500" size={18} />;
      case 'milestone':
        return <Target className="text-green-500" size={18} />;
      case 'reflection':
        return <Lightbulb className="text-purple-500" size={18} />;
      default:
        return <TrendingUp className="text-blue-500" size={18} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'achievement':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'milestone':
        return 'border-l-green-500 bg-green-50';
      case 'reflection':
        return 'border-l-purple-500 bg-purple-50';
      case 'challenge':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return d.toLocaleDateString();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp size={28} /> Progress Feed
              </h2>
              <p className="text-green-100 mt-1">Share your achievements with the group</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-white text-green-600 px-4 py-2 rounded-lg hover:bg-green-50"
              >
                <Plus size={18} /> Share Progress
              </button>
              <button onClick={onClose} className="p-2 hover:bg-green-500 rounded-full">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 border-b bg-gray-50">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="What did you accomplish?"
                value={newProgress.title}
                onChange={(e) => setNewProgress({ ...newProgress, title: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
              />
              <textarea
                placeholder="Share more details... (optional)"
                value={newProgress.description}
                onChange={(e) => setNewProgress({ ...newProgress, description: e.target.value })}
                className="w-full border rounded-lg px-4 py-2"
                rows={3}
              />
              <div className="flex justify-between items-center">
                <select
                  value={newProgress.type}
                  onChange={(e) => setNewProgress({ ...newProgress, type: e.target.value })}
                  className="border rounded px-3 py-1"
                >
                  <option value="update">📝 Update</option>
                  <option value="achievement">🏆 Achievement</option>
                  <option value="milestone">🎯 Milestone</option>
                  <option value="reflection">💡 Reflection</option>
                  <option value="challenge">💪 Challenge</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : progress.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-600">No progress updates yet</h3>
              <p className="text-gray-500 mt-1">Be the first to share your progress!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {progress.map((item) => (
                <div
                  key={item._id}
                  className={`border-l-4 rounded-lg p-4 ${getTypeColor(item.type)}`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold">
                        {item.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <span className="font-medium">{item.user?.name}</span>
                        <span className="text-gray-500 text-sm ml-2">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                      {item.user?._id === user?._id && (
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                  {item.description && <p className="text-gray-700 mb-3">{item.description}</p>}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => handleLike(item._id)}
                      className={`flex items-center gap-1 text-sm ${
                        item.reactions?.some((r) => r.user === user?._id)
                          ? 'text-red-500'
                          : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart
                        size={16}
                        fill={
                          item.reactions?.some((r) => r.user === user?._id)
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                      <span>{item.reactions?.length || 0}</span>
                    </button>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <MessageCircle size={16} />
                      <span>{item.comments?.length || 0}</span>
                    </span>
                  </div>

                  {/* Comments */}
                  {item.comments && item.comments.length > 0 && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      {item.comments.slice(-3).map((comment, i) => (
                        <div key={i} className="flex gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {comment.user?.name?.charAt(0) || '?'}
                          </div>
                          <div className="bg-white rounded-lg px-3 py-1 flex-1">
                            <span className="font-medium">{comment.user?.name}</span>
                            <span className="ml-2 text-gray-700">{comment.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText[item._id] || ''}
                      onChange={(e) =>
                        setCommentText({ ...commentText, [item._id]: e.target.value })
                      }
                      onKeyPress={(e) => e.key === 'Enter' && handleComment(item._id)}
                      className="flex-1 border rounded-full px-4 py-1 text-sm"
                    />
                    <button
                      onClick={() => handleComment(item._id)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
