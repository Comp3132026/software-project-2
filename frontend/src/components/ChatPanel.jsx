/**
 * ChatPanel Component
 * Displays group chat, pinned announcements, and message actions.
 */

import { X, Send, Trash2, AlertTriangle, Pin, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useChat } from '../hooks/useChat';
import ProgressMessageBubble from './ProgressMessage';
import ChatModal from './ChatModal';

export default function ChatPanel({ groupId, onClose }) {
  const { user } = useAuth();
  const { isOwner, isModerator, members } = useGroup();

  const currentMember = members?.find((m) => m.userId === user?._id);

  const {
    messages,
    pinnedMessage,
    text,
    setText,
    loading,
    messagesEndRef,
    sendMessage,
    deleteMessage,
    warnMessage,
    pinMessage,
    hideAnnouncement,
    setHideAnnouncement,
  } = useChat(groupId, user, isOwner, isModerator);

  const [showWarning, setShowWarning] = useState(false);
  const [warningReason, setWarningReason] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState(null);

  return (
    <div className="bg-gradient-to-br from-dark-800 to-dark-900 text-white w-96 h-[520px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-xl flex items-center justify-center">
            <MessageCircle size={16} className="text-primary-400" />
          </div>
          <h3 className="font-display font-bold">Group Chat</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {/* Announcement */}
        {pinnedMessage && !hideAnnouncement && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-3 animate-slide-down">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <Pin size={12} />
                Announcement
              </p>
              <button
                onClick={() => setHideAnnouncement(true)}
                className="text-amber-400/60 hover:text-white transition-colors"
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-sm">{pinnedMessage.content}</p>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-white/40 text-sm">No messages yet</p>
            <p className="text-white/20 text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {/* Normal Messages */}
        {messages.map((msg) => {
          if (msg.type === 'progress') {
            return <ProgressMessageBubble key={msg._id} msg={msg} />;
          }

          const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender?._id;
          const isMe = senderId === user?._id;

          return (
            <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`relative max-w-[80%] p-3 rounded-2xl transition-all
                  ${
                    msg.type === 'warning'
                      ? 'bg-amber-500 text-dark-800'
                      : isMe
                        ? 'bg-primary-600 rounded-br-md'
                        : 'bg-white/10 rounded-bl-md'
                  }`}
              >
                <p
                  className={`text-xs mb-1.5 font-medium ${
                    msg.type === 'warning' ? 'text-dark-800/70' : 'text-white/60'
                  }`}
                >
                  {msg.sender?.name}
                  {isMe && ' (You)'}
                </p>

                {msg.isDeleted ? (
                  <p className="text-xs italic opacity-50">This message was deleted</p>
                ) : (
                  <p className="text-sm break-words">{msg.content}</p>
                )}

                {/* Pin button for mods */}
                {!msg.isDeleted && (isOwner || isModerator) && (
                  <button
                    onClick={() => {
                      setHideAnnouncement(false);
                      pinMessage(msg);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/40 hover:text-amber-400 transition-all"
                  >
                    <Pin size={12} />
                  </button>
                )}

                {/* Action Buttons */}
                {!msg.isDeleted && !isMe && (
                  <div className="flex gap-2 mt-2 justify-end">
                    {(isOwner || isModerator) && (
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="p-1 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedMessageId(msg._id);
                        setShowWarning(true);
                      }}
                      className="p-1 text-white/30 hover:text-amber-400 transition-colors"
                    >
                      <AlertTriangle size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <ChatModal
          title="Issue Warning"
          placeholder="Enter warning reason..."
          value={warningReason}
          setValue={setWarningReason}
          buttonText="Warn"
          buttonColor="bg-amber-500"
          onClose={() => setShowWarning(false)}
          onSubmit={() => {
            warnMessage(selectedMessageId, warningReason);
            setWarningReason('');
            setShowWarning(false);
          }}
        />
      )}

      {/* Input Field */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        {currentMember?.isSuspended && (
          <p className="text-red-400 text-xs mb-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            You are suspended and cannot send messages.
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={currentMember?.isSuspended ? 'You are suspended...' : 'Type a message...'}
            className={`flex-1 px-4 py-3 rounded-xl text-sm placeholder-white/30 transition-all
              ${
                currentMember?.isSuspended
                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                  : 'bg-white/10 text-white focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary-500/30'
              }`}
            onKeyDown={(e) =>
              e.key === 'Enter' && !loading && !currentMember?.isSuspended && sendMessage()
            }
            disabled={loading || currentMember?.isSuspended}
          />

          <button
            onClick={sendMessage}
            disabled={loading || !text.trim() || currentMember?.isSuspended}
            className={`p-3 rounded-xl transition-all
              ${
                currentMember?.isSuspended
                  ? 'bg-white/5 opacity-50 cursor-not-allowed'
                  : 'bg-primary-600 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/20'
              }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
