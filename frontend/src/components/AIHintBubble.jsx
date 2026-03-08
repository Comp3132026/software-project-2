import { createPortal } from 'react-dom';

export default function AIHintBubbleStack({ reasons }) {
  const items = reasons.filter(Boolean); // remove empty ones

  if (items.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed bottom-40 right-60 z-[9999] space-y-3">
      {items.map((text, index) => (
        <div
          key={index}
          className="
            bg-white border shadow-xl 
            px-4 py-3 rounded-lg 
            w-64 animate-fadeIn
          "
        >
          <p className="text-sm text-gray-700">{text}</p>
        </div>
      ))}
    </div>,
    document.body
  );
}
