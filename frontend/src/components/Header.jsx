import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronRight, CheckSquare, Home, LogOut, Sparkles, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import PanelList from './PanelList';
import { formatTime } from '../hooks/formatTime';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const { notifications, reloadNotifications, frequency, setFrequency } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-white px-6 py-4 shadow-lg shadow-primary-900/20">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">LifeSync</span>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <Home size={18} />
                <span>Groups</span>
              </button>
              <button
                onClick={() => navigate('/my-tasks')}
                className={`nav-link ${location.pathname === '/my-tasks' ? 'active' : ''}`}
              >
                <CheckSquare size={18} />
                <span>My Tasks</span>
              </button>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          {isAuthenticated && (
            <button
              onClick={() => {
                reloadNotifications();
                setShowNotifications(true);
              }}
              className="relative p-2.5 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent-500 text-xs text-white min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center font-semibold shadow-lg animate-pulse-soft">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Notifications Modal*/}
          {showNotifications && (
            <PanelList
              title="Notifications"
              items={notifications}
              onClose={() => setShowNotifications(false)}
              showFrequency={true}
              frequency={frequency}
              setFrequency={setFrequency}
              renderItem={(n) => (
                <>
                  <p className="text-sm text-dark-800">{n.message}</p>
                  <p className="text-xs text-surface-300 mt-1">{formatTime(n.createdAt)}</p>
                </>
              )}
            />
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* User info */}
              <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/10 rounded-xl">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <User size={14} />
                </div>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>

              {/* Profile button */}
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 hover:bg-white/10 px-3 py-2 rounded-xl transition-colors"
              >
                <span className="text-sm font-medium">Profile</span>
                <ChevronRight size={16} />
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white/10 hover:bg-red-500/80 px-3 py-2 rounded-xl transition-all duration-200 group"
              >
                <LogOut size={16} className="group-hover:text-white" />
                <span className="text-sm font-medium hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="btn-primary bg-white/20 hover:bg-white/30 shadow-none hover:shadow-none"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
