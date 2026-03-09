import { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  X,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  User,
  MessageSquare,
} from 'lucide-react';
import { messagesAPI, membersAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function DirectMessages({ groupId, initialUserId, onClose }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [showNewConversation, setShowNewConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New: subject + body with validations
  const [subject, setSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef(null);

  // Load conversations + group members
  useEffect(() => {
    loadConversations();
    if (groupId) {
      loadGroupMembers();
    }
  }, [groupId]);

  // Auto-select initial user if provided
  useEffect(() => {
    if (initialUserId && members.length > 0) {
      const found = members.find((m) => m._id === initialUserId);
      if (found) {
        selectUser(found);
      }
    }
  }, [initialUserId, members]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await messagesAPI.getConversations();
      setConversations(res.data || []);
    } catch (err) {
      console.log('No conversations loaded');
      setConversations([]);
    }
    setLoading(false);
  };

  const loadGroupMembers = async () => {
    try {
      const res = await membersAPI.getByGroup(groupId);
      // Exclude self from recipients
      setMembers(res.data.filter((m) => m._id !== user?._id));
    } catch (err) {
      console.log('Could not load members', err);
    }
  };

  const selectUser = async (userData) => {
    setSelectedUser(userData);
    setShowNewConversation(false);
    setLoadingMessages(true);

    try {
      const res = await messagesAPI.getThread(userData._id, groupId ? { group: groupId } : {});
      setMessages(res.data.messages || res.data || []);
      // Mark thread as read (ignore errors)
      await messagesAPI
        .markThreadRead(userData._id, groupId ? { group: groupId } : {})
        .catch(() => {});
    } catch (err) {
      setMessages([]);
    }
    setLoadingMessages(false);
  };

  const handleSend = async () => {
    if (!selectedUser) {
      toast.error('Select a member to message');
      return;
    }

    const trimmedBody = newMessage.trim();
    const trimmedSubject = subject.trim();

    if (!trimmedBody) {
      toast.error('Message body is required');
      return;
    }

    if (trimmedBody.length > 5000) {
      toast.error('Message is too long (max 5000 characters)');
      return;
    }

    if (trimmedSubject.length > 200) {
      toast.error('Subject is too long (max 200 characters)');
      return;
    }

    try {
      const payload = {
        to: selectedUser._id,
        content: trimmedBody,
        group: groupId,
      };
      if (trimmedSubject) {
        payload.subject = trimmedSubject;
      }

      const res = await messagesAPI.send(payload);

      // Append sent message to current thread
      const newMsg = res.data || res;
      setMessages((prev) => [...prev, newMsg]);
      setNewMessage('');
      setSubject('');

      // Refresh conversations (for unread counts + last message)
      loadConversations();
      toast.success('Message sent');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to send message');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) {
      return '';
    }
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 1) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }
    if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }

    return d.toLocaleDateString();
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail size={24} /> Messages
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-blue-500 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: conversations + start new */}
          <div className="w-72 border-r flex flex-col">
            {/* Top bar: back / new message */}
            <div className="p-3 flex items-center justify-between border-b bg-gray-50">
              {showNewConversation ? (
                <button
                  onClick={() => setShowNewConversation(false)}
                  className="flex items-center gap-1 text-sm text-gray-600"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              ) : (
                <span className="text-sm font-medium text-gray-700">Conversations</span>
              )}

              <button
                onClick={() => {
                  setShowNewConversation(true);
                  setSelectedUser(null);
                }}
                className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700"
              >
                New
              </button>
            </div>

            {/* New conversation view */}
            {showNewConversation ? (
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search group members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-sm border rounded px-2 py-1"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {filteredMembers.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2">No members found.</p>
                  ) : (
                    filteredMembers.map((m) => (
                      <button
                        key={m._id}
                        onClick={() => selectUser(m)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                          {m.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{m.name}</div>
                          <div className="text-xs text-gray-500 truncate">{m.email}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Conversation list
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Mail size={32} className="mx-auto mb-2 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a new message</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.user._id}
                      onClick={() => selectUser(conv.user)}
                      className={`w-full flex items-center gap-3 p-3 border-b hover:bg-gray-100 text-left ${
                        selectedUser?._id === conv.user._id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        {conv.user.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium truncate">{conv.user.name}</span>
                          <span className="text-xs text-gray-400">
                            {formatTime(conv.lastMessage?.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conv.lastMessage?.content || 'No messages'}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right: messages with selected user */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b flex items-center gap-3 bg-white">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {selectedUser.name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="font-medium">{selectedUser.name}</div>
                    <div className="text-sm text-gray-500">{selectedUser.email}</div>
                  </div>
                </div>

                {/* Messages list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                  {loadingMessages ? (
                    <div className="text-center text-gray-500 py-8">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <p>No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = (msg.from?._id || msg.from) === user?._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-blue-600 text-white rounded-br-none'
                                  : 'bg-white border rounded-bl-none'
                              }`}
                            >
                              {msg.subject && (
                                <div
                                  className={`text-sm font-medium mb-1 ${
                                    isOwn ? 'text-blue-100' : 'text-gray-500'
                                  }`}
                                >
                                  {msg.subject}
                                </div>
                              )}
                              <p>{msg.content}</p>
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${
                                isOwn ? 'justify-end' : ''
                              }`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {isOwn &&
                                (msg.isRead ? (
                                  <CheckCheck size={12} className="text-blue-500" />
                                ) : (
                                  <Check size={12} />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input area: subject + body */}
                <div className="p-4 border-t bg-white space-y-2">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-xs text-gray-500">Messaging {selectedUser.name}</span>
                  </div>

                  {/* Subject field */}
                  <input
                    type="text"
                    placeholder="Subject (optional)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-1"
                    maxLength={200}
                  />

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      className="flex-1 border rounded-lg px-4 py-2"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm">Or start a new message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
