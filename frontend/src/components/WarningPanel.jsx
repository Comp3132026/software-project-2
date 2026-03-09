// src/components/WarningPanel.jsx
import { useEffect, useState } from 'react';
import { AlertTriangle, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { warningsAPI } from '../utils/api';

export default function WarningPanel({ groupId, members = [], canModerate, onClose }) {
  const [loading, setLoading] = useState(true);
  const [groupWarnings, setGroupWarnings] = useState([]);
  const [myWarnings, setMyWarnings] = useState([]);
  const [activeTab, setActiveTab] = useState(canModerate ? 'issue' : 'mine');

  const [formData, setFormData] = useState({
    userId: '',
    type: 'spam',
    severity: 'medium',
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      if (canModerate) {
        const res = await warningsAPI.getByGroup(groupId);
        // backend returns { warnings: [...] }
        setGroupWarnings(res.data?.warnings || []);
      }
      const mine = await warningsAPI.getMyWarnings(groupId);
      // backend returns an array
      setMyWarnings(mine.data || []);
    } catch (err) {
      console.error('Failed to load warnings', err);
      toast.error('Failed to load warnings');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, canModerate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleIssue = async () => {
    if (!formData.userId || !formData.type || !formData.reason.trim()) {
      toast.error('Select a member, type and enter a reason.');
      return;
    }

    try {
      await warningsAPI.issue(groupId, formData);
      toast.success('Warning sent.');
      setFormData((prev) => ({ ...prev, reason: '' }));
      await loadData();
      setActiveTab('group');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send warning.');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <AlertTriangle />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Moderation – Warnings</h2>
              <p className="text-sm text-gray-500">
                Send warnings to members who break discussion rules.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b flex gap-4">
          {canModerate && (
            <>
              <button
                className={`pb-2 text-sm ${
                  activeTab === 'issue' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('issue')}
              >
                Issue warning
              </button>
              <button
                className={`pb-2 text-sm ${
                  activeTab === 'group' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'
                }`}
                onClick={() => setActiveTab('group')}
              >
                Group warnings
              </button>
            </>
          )}
          <button
            className={`pb-2 text-sm ${
              activeTab === 'mine' ? 'border-b-2 border-red-500 text-red-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('mine')}
          >
            My warnings
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              {/* Issue form */}
              {activeTab === 'issue' && canModerate && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member *
                      </label>
                      <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="">Select member…</option>
                        {members.map((m, index) => {
                          // Support both:
                          // 1) { user: { _id, name }, role }
                          // 2) { _id, name, role }
                          const memberUser = m?.user || m;
                          const memberId = memberUser?._id;
                          if (!memberId) {
                            return null;
                          }

                          const memberName = memberUser.name || 'Unknown';
                          const role = m?.role;

                          return (
                            <option key={memberId || index} value={memberId}>
                              {memberName}
                              {role ? ` (${role})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="spam">Spam</option>
                        <option value="harassment">Harassment</option>
                        <option value="inappropriate_content">Inappropriate content</option>
                        <option value="off_topic">Off-topic</option>
                        <option value="inactivity">Inactivity</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Severity
                      </label>
                      <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleChange}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Explain which rule was broken and what needs to change..."
                    />
                  </div>

                  <button
                    onClick={handleIssue}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                  >
                    <Shield size={16} />
                    Send warning
                  </button>
                </div>
              )}

              {/* Group warnings list (moderator/owner) */}
              {activeTab === 'group' && canModerate && (
                <div className="space-y-3">
                  {groupWarnings.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No warnings have been issued in this group yet.
                    </p>
                  ) : (
                    groupWarnings.map((w) => {
                      const warnedUser = w?.user; // may be populated or just an ID
                      const warnedName = warnedUser?.name || w.userName || 'Unknown user';
                      const issuedByName = w?.issuedBy?.name || 'Unknown';
                      const createdAt = w?.createdAt ? new Date(w.createdAt).toLocaleString() : '';

                      return (
                        <div key={w._id} className="border rounded-lg px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{warnedName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              {w.type}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {w.severity}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{w.reason}</p>
                          {createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Issued by {issuedByName} on {createdAt}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* My warnings list (any user) */}
              {activeTab === 'mine' && (
                <div className="space-y-3">
                  {myWarnings.length === 0 ? (
                    <p className="text-sm text-gray-500">You don&apos;t have any warnings.</p>
                  ) : (
                    myWarnings.map((w) => {
                      const groupName = w?.group?.name || 'Group';
                      const issuedByName = w?.issuedBy?.name || 'Unknown';
                      const createdAt = w?.createdAt ? new Date(w.createdAt).toLocaleString() : '';

                      return (
                        <div key={w._id} className="border rounded-lg px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{groupName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              {w.type}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                              {w.severity}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">{w.reason}</p>
                          {createdAt && (
                            <p className="text-xs text-gray-400 mt-1">
                              Issued by {issuedByName} on {createdAt}
                            </p>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
