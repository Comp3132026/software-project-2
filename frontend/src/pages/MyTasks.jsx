import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Clock,
  AlertCircle,
  Filter,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { tasksAPI } from '../utils/api';
import { filterTasks, formatDate, isOverdue } from '../hooks/filterTasks';
import Header from '../components/Header';
import toast from 'react-hot-toast';

export default function MyTasks() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // API FILTER VALUES
  const [filter, setFilter] = useState('all');
  const filterOptions = [
    { label: 'All', value: 'all', icon: ListTodo },
    { label: 'Pending', value: 'pending', icon: Clock },
    { label: 'High Priority', value: 'high', icon: AlertTriangle },
    { label: 'Completed', value: 'completed', icon: CheckCircle2 },
  ];

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await tasksAPI.getMyTasks({});
      const filtered = filterTasks(res.data, filter);
      setTasks(filtered);
    } catch (err) {
      console.log(err);
      toast.error('Failed to load tasks');
    }
    setLoading(false);
  };

  const handleComplete = async (taskId) => {
    try {
      await tasksAPI.complete(taskId);
      toast.success('Task completed!');
      loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete task');
    }
  };

  // Stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length;
  const overdueTasks = tasks.filter((t) => t.status !== 'completed' && isOverdue(t.dueDate)).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-dark-800 mb-1">My Tasks</h1>
              <p className="text-surface-300">Track and manage all your assigned tasks</p>
            </div>
            <button onClick={() => navigate('/')} className="btn-ghost">
              ← Back to Groups
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <ListTodo className="w-5 h-5 text-primary-500" />
                <span className="text-xs font-medium text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
                  Total
                </span>
              </div>
              <div className="stat-value text-dark-800">{totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {completionRate}%
                </span>
              </div>
              <div className="stat-value text-emerald-600">{completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <TrendingUp className="w-4 h-4 text-amber-400" />
              </div>
              <div className="stat-value text-amber-600">{pendingTasks}</div>
              <div className="stat-label">Pending</div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                {overdueTasks > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </div>
              <div className="stat-value text-red-600">{overdueTasks}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            <Filter size={18} className="text-surface-300 flex-shrink-0" />
            {filterOptions.map((f) => {
              const Icon = f.icon;
              const isActive = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                      : 'bg-white text-dark-800 border border-surface-100 hover:border-primary-200 hover:bg-primary-50'
                  }`}
                >
                  <Icon size={16} />
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* Tasks List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-surface-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-surface-100 rounded w-1/3" />
                      <div className="h-4 bg-surface-100 rounded w-2/3" />
                      <div className="h-4 bg-surface-100 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="card p-12 text-center animate-fade-in">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ListTodo className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-800 mb-2">No tasks found</h3>
              <p className="text-surface-300 mb-6">
                {filter === 'all'
                  ? "You don't have any tasks assigned to you"
                  : `No ${filter} tasks found`}
              </p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Go to Groups
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => {
                const overdueTask = task.status !== 'completed' && isOverdue(task.dueDate);

                return (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/group/${task.group._id}`)}
                    className={`card p-5 cursor-pointer group animate-slide-up hover:scale-[1.01] ${
                      overdueTask ? 'border-l-4 border-l-red-500' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className={`font-semibold text-dark-800 group-hover:text-primary-600 transition-colors ${
                              task.status === 'completed' ? 'line-through text-surface-300' : ''
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.isHabit && <span className="badge-info">🔄 {task.frequency}</span>}
                        </div>

                        {task.description && (
                          <p className="text-sm text-surface-300 mb-3 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          {/* Group Name */}
                          <span className="text-primary-600 font-medium hover:underline">
                            {task.group?.name}
                          </span>

                          <span className="text-surface-200">•</span>

                          {/* Due Date */}
                          <span
                            className={`flex items-center gap-1 ${
                              overdueTask ? 'text-red-600 font-medium' : 'text-surface-300'
                            }`}
                          >
                            <Clock size={14} />
                            {formatDate(task.dueDate)}
                            {overdueTask && <AlertCircle size={14} />}
                          </span>

                          <span className="text-surface-200">•</span>

                          {/* Status & Priority Badges */}
                          <span
                            className={`badge border ${
                              task.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : task.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-surface-100 text-surface-300 border-surface-200'
                            }`}
                          >
                            {task.status}
                          </span>

                          <span
                            className={`badge border ${
                              task.priority === 'high'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : task.priority === 'medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      {/* Complete Button */}
                      {task.status !== 'completed' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(task._id);
                          }}
                          className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                          title="Mark as complete"
                        >
                          <Check size={20} />
                        </button>
                      )}

                      {task.status === 'completed' && (
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0">
                          <CheckCircle2 size={20} />
                        </div>
                      )}
                    </div>

                    {/* Completion Status */}
                    {task.completedBy && task.completedBy.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-surface-100 text-xs text-surface-300">
                        ✓ Completed by: {task.completedBy.map((c) => c.user?.name).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

