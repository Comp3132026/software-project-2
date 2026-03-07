import { useState, useRef, useEffect } from 'react';
import { ListFilterPlus } from 'lucide-react';

export default function Filter({ view, filters, setFilters, memberFilters, setMemberFilters }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Toggle TASK filters
  const toggleTaskFilter = (key) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle MEMBER filters
  const toggleMemberFilter = (key) => {
    setMemberFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={menuRef}>
      {/* Icon */}
      <ListFilterPlus
        size={24}
        className="text-white cursor-pointer"
        onClick={() => setOpen(!open)}
      />

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute top-8 left-0 bg-white shadow-lg border border-gray-200 rounded-lg p-4 w-56 z-30">
          <p className="text-xs text-gray-500 mb-3">Show in Dashboard:</p>

          {/* -----------------------------
               TASK VIEW FILTERS
          ------------------------------ */}
          {view === 'tasks' && (
            <>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.completed}
                  onChange={() => toggleTaskFilter('completed')}
                />
                <span>Completed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.pending}
                  onChange={() => toggleTaskFilter('pending')}
                />
                <span>Pending</span>
              </label>
            </>
          )}

          {/* -----------------------------
               MEMBER STATUS FILTERS
          ------------------------------ */}
          {view === 'members' && (
            <>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={memberFilters.active}
                  onChange={() => toggleMemberFilter('active')}
                />
                <span>Active</span>
              </label>

              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={memberFilters.inactive}
                  onChange={() => toggleMemberFilter('inactive')}
                />
                <span>Inactive</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={memberFilters.unresponsive}
                  onChange={() => toggleMemberFilter('unresponsive')}
                />
                <span>Unresponsive</span>
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
}
