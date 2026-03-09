import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { tasksAPI } from '../utils/api';
import DashboardCircle from './Dashboard';

export default function GroupCard({ group }) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadTasks();
  }, [group._id]);

  const loadTasks = async () => {
    try {
      const res = await tasksAPI.getByGroup(group._id);
      setTasks(res.data.slice(0, 3));
    } catch {
      /* Silent fail */
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/group/${group._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="card p-6 cursor-pointer group hover:scale-[1.02] hover:shadow-glow"
    >
      <div className="flex gap-5">
        {/* Dashboard Circle */}
        <div className="flex-shrink-0">
          <div className="chart-glow">
            <DashboardCircle size={100} textSize="text-sm" colors={[]} />
          </div>
          <div className="mt-3 text-center">
            <span className="text-sm font-semibold text-primary-600">
              {group.completionRate || 0}%
            </span>
            <span className="text-xs text-surface-300 block">completed</span>
          </div>
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-display font-bold text-lg text-dark-800 truncate group-hover:text-primary-600 transition-colors">
              {group.name}
            </h3>
            <ArrowRight
              size={18}
              className="text-surface-200 group-hover:text-primary-500 group-hover:translate-x-1 transition-all flex-shrink-0"
            />
          </div>

          <p className="text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">
            Tasks
          </p>

          {tasks.length > 0 ? (
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <div key={t._id} className="flex items-center gap-2 text-sm text-dark-800/70">
                  <CheckCircle2
                    size={14}
                    className={t.status === 'completed' ? 'text-emerald-500' : 'text-surface-200'}
                  />
                  <span
                    className={`truncate ${t.status === 'completed' ? 'line-through text-surface-300' : ''}`}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
              {group.taskCount > 3 && (
                <p className="text-xs text-primary-500 font-medium mt-2">
                  +{group.taskCount - 3} more tasks
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-surface-300 italic">No tasks yet</p>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-surface-100">
        <div className="flex items-center gap-2 text-sm text-surface-300">
          <Users size={16} />
          <span>{group.memberCount || group.members?.length || 0} members</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-primary">{group.taskCount || 0} tasks</span>
        </div>
      </div>
    </div>
  );
}
