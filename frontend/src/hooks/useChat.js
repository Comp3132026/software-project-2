import { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../utils/api';
import toast from 'react-hot-toast';

/**
 * Custom hook .
 */
export const useChat = (groupId, _user, _isOwner, _isModerator) => {
  const [messages, setMessages] = useState([]);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [hideAnnouncement, setHideAnnouncement] = useState(false);
  const messagesEndRef = useRef(null);

  // ---------------------
  // Load messages on mount
  // ---------------------
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadMessages();
  }, [groupId]);

  // ---------------------
  // Auto-scroll when messages change
  // ---------------------
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Scroll to the last message smoothly
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Fetch messages and separate pinned message
   */
  const loadMessages = async () => {
    try {
      const res = await chatAPI.getMessages(groupId);
      const all = res.data;

      const pinned = all.find((m) => m.pinned === true);
      setPinnedMessage(pinned || null);

      setMessages(all);
    } catch (err) {
      console.log(err);
    }
  };

  /**
   * Send a new message
   */
  const sendMessage = async () => {
    if (!text.trim()) {
      return;
    }
    setLoading(true);

    try {
      await chatAPI.send({ groupId, content: text.trim() });
      setText('');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }

    setLoading(false);
  };

  /**
   * Delete a message (owner/moderator OR message author)
   */
  const deleteMessage = async (id) => {
    try {
      await chatAPI.delete(id);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
    }
  };

  /**
   * Report a message
   */
  const warnMessage = async (id, reason) => {
    try {
      await chatAPI.warn(id, { reason });
      toast.success('Warning issued!');
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadMessages();
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || 'Failed to warn');
    }
  };

  /**
   * Pin or unpin a message (Announcement)
   * Only owner or moderator allowed
   */
  const pinMessage = async (msg) => {
    try {
      const res = await chatAPI.pin(msg._id);
      const updated = res.data;

      if (updated.pinned) {
        setPinnedMessage(updated); // update content
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));

        //REOPEN ANNOUNCEMENT EVERY TIME PIN SOMETHING
        setHideAnnouncement(false);
      } else {
        setPinnedMessage(null);

        // Restore \as normal message
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      }

      toast.success(updated.pinned ? 'Pinned as announcement' : 'Unpinned');
    } catch (err) {
      toast.error('Failed to pin');
    }
  };

  return {
    messages,
    pinnedMessage,
    text,
    setText,
    loading,
    messagesEndRef,
    sendMessage,
    deleteMessage,
    pinMessage,
    hideAnnouncement,
    setHideAnnouncement,
    warnMessage,
  };
};
