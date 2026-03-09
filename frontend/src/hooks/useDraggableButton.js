import { useState, useEffect } from 'react';

export default function useDraggableFloatingButton(storageKey = 'chat-button-position') {
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : { x: 20, y: 20 };
  });

  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) {
      return;
    }

    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (dragging) {
      localStorage.setItem(storageKey, JSON.stringify(position));
    }
    setDragging(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  return {
    position,
    handleMouseDown,
  };
}
