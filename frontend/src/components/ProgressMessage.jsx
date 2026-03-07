import { formatTime } from '../hooks/formatTime';

export default function ProgressMessageBubble({ msg }) {
  return (
    <div className="p-3 my-2 rounded-lg bg-blue-100 border-l-4 border-blue-500 shadow-md animate-fadeIn">
      <div className="flex items-center gap-2 text-blue-700 font-semibold">⭐ Progress Update</div>

      <p className="text-blue-900 mt-1 whitespace-pre-wrap">{msg.content}</p>
      <p className="text-xs text-blue-600 mt-1">{formatTime(msg.createdAt)}</p>
    </div>
  );
}
