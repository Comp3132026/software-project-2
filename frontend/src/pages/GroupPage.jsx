import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  LogOut,
  MessageCircle,
  Share2,
  ArrowLeft,
  History,
  Sparkles,
  Megaphone,
} from 'lucide-react';

// Contexts & Utils
import { useAuth } from '../context/AuthContext';
import { GroupProvider } from '../context/GroupContext';
import { useNotifications } from '../context/NotificationContext';
import { computeGroupRoles } from '../utils/groupRoles';
import {
  filterDashboardTasks,
  getDashboardColor,
  getStatusColors,
  getStatusValues,
} from '../hooks/filterTasks';

// Hooks
import useGroupData from '../hooks/useGroupData';
import useModalReset from '../hooks/useModalReset';
import useGroupActions from '../hooks/useGroupActions';
import useTaskActions from '../hooks/useTaskAction';
import useDraggableFloatingButton from '../hooks/useDraggableButton';

// Components
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import MemberList from '../components/MemberList';
import ChatPanel from '../components/ChatPanel';
import GroupForm from '../components/GroupForm';
import ConfirmDialog from '../components/ConfirmDialog';
import LeaveGroupModal from '../components/LeaveGroupModal';
import ChatModal from '../components/ChatModal';
import PanelList from '../components/PanelList';
import DashboardCircle from '../components/Dashboard';
import Filter from '../components/Filter';
import AnnouncementModal from '../components/AnnounementModal';
import { formatTime } from '../hooks/formatTime';

export default function GroupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Load all group-related data
  const { group, tasks, members, notifications, history, loading, reloadAll } = useGroupData(id);

  // Notification context
  const { frequency, setFrequency } = useNotifications();

  // Modal states
  const [showChat, setShowChat] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [progressText, setProgressText] = useState('');

  // Clean modal reset on mount
  useModalReset({
    setShowChat,
    setShowNotifications,
    setShowHistory,
  });

  // Group Roles
  const roles = computeGroupRoles(group, members, user);

  // Group & Task Actions hooks
  const groupActions = useGroupActions({
    group,
    reloadAll,
    navigate,
    id,
    progressText,
    setProgressText,
    user,
    setShowChat,
  });
  const taskActions = useTaskActions({ loadData: reloadAll });

  // Draggable Chat Button
  const { position, handleMouseDown } = useDraggableFloatingButton();

  const [dashboardView, setDashboardView] = useState('tasks');

  // Filters tasks completed
  const [filters, setFilters] = useState({
    completed: true,
    overdue: false,
    pending: false,
  });

  //member status filter
  const [memberFilters, setMemberFilters] = useState({
    active: true,
    inactive: false,
    unresponsive: false,
  });

  // Task side
  const filteredTasks = filterDashboardTasks(tasks, filters);

  const totalFiltered =
    filteredTasks.completed.length + filteredTasks.pending.length + filteredTasks.overdue.length;

  const taskValues = [
    filteredTasks.completed.length,
    filteredTasks.pending.length,
    filteredTasks.overdue.length,
  ];

  const chartColors = getDashboardColor(filters);

  // Member side
  const statusColors = getStatusColors(memberFilters);

  const statusValues = getStatusValues(memberFilters, {
    active: group?.activeCount ?? 0,
    inactive: group?.inactiveCount ?? 0,
    unresponsive: group?.unresponsiveCount ?? 0,
  });

  if (loading || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-surface-300 font-medium">Loading group...</p>
        </div>
      </div>
    );
  }

  return (
    <GroupProvider value={{ group, members, ...roles }}>
      <div className="min-h-screen flex flex-col bg-surface-50">
        {/* ---------------- HEADER ---------------- */}
        <header className="bg-white border-b border-surface-100 px-6 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} className="text-surface-300" />
              </button>
              <div>
                <h1 className="font-display font-bold text-xl text-dark-800">{group.name}</h1>
                <p className="text-sm text-surface-300">
                  {members.length} members • {tasks.length} tasks
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="p-2.5 hover:bg-surface-100 rounded-xl transition-colors relative"
                title="View Activity History"
              >
                <History size={20} className="text-dark-800" />
              </button>

              <button
                onClick={() => setShowNotifications(true)}
                className="p-2.5 hover:bg-surface-100 rounded-xl transition-colors relative"
                title="View Notifications"
              >
                <Bell size={20} className="text-dark-800" />
              </button>

              {/* Announcement Button - Only for Owner/Moderator */}
              {(roles.isOwner || roles.isModerator) && (
                <button
                  onClick={() => setShowAnnouncement(true)}
                  className="p-2.5 hover:bg-amber-50 rounded-xl transition-colors relative"
                  title="Send Announcement"
                >
                  <Megaphone size={20} className="text-amber-600" />
                </button>
              )}

              <div className="flex flex-wrap gap-2">
                {/* Edit Group - Only Owner */}
                {roles.canEditGroup && (
                  <button onClick={groupActions.handleEditGroupClick} className="btn-primary py-2">
                    <Edit2 size={16} /> Edit
                  </button>
                )}

                {/* Delete Group - Only Owner */}
                {roles.canDeleteGroup && (
                  <button
                    onClick={() => groupActions.setShowDeleteConfirm(true)}
                    className="btn-danger py-2"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}

                <button
                  onClick={() => groupActions.setShowShareProgress(true)}
                  className="btn-accent py-2"
                >
                  <Share2 size={16} /> Share Progress
                </button>

                <button
                  onClick={() => groupActions.setShowLeaveModal(true)}
                  className="btn-secondary py-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <LogOut size={16} /> Leave
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ---------------- MAIN ---------------- */}
        <div className="flex flex-1 overflow-hidden">
          {/* -------- LEFT DASHBOARD -------- */}
          <div className="relative basis-[45%] flex flex-col items-center justify-center bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 p-8">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-10 left-10 w-40 h-40 bg-primary-400/10 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 chart-glow">
              <DashboardCircle
                size={320}
                colors={dashboardView === 'members' ? statusColors : chartColors}
                values={dashboardView === 'members' ? statusValues : taskValues}
              />
            </div>

            <p className="relative z-10 text-white/90 text-xl font-medium mt-8">
              <span className="text-white font-bold">{totalFiltered}</span> / {tasks.length} tasks
              shown
            </p>

            <button
              onClick={() => setShowHistory(true)}
              className="absolute top-4 right-4 flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
            >
              <History size={16} />
              View History
            </button>

            {/* LEGEND */}
            <div className="absolute bottom-4 right-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-white/80">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="text-white/80">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-white/80">Overdue</span>
              </div>
            </div>

            {/* Filter controls */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-3">
              <Filter
                view={dashboardView}
                filters={filters}
                setFilters={setFilters}
                memberFilters={memberFilters}
                setMemberFilters={setMemberFilters}
              />
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="tasks"
                    checked={dashboardView === 'tasks'}
                    onChange={() => setDashboardView('tasks')}
                    className="accent-primary-400"
                  />
                  <span className="text-white text-sm font-medium">Tasks</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="members"
                    checked={dashboardView === 'members'}
                    onChange={() => setDashboardView('members')}
                    className="accent-primary-400"
                  />
                  <span className="text-white text-sm font-medium">Members</span>
                </label>
              </div>
            </div>
          </div>

          {/* -------- RIGHT PANEL -------- */}
          <div className="basis-[55%] flex flex-col bg-surface-50">
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl text-dark-800">Tasks & Habits</h3>
                {!roles.isViewer && (
                  <button
                    onClick={() => {
                      taskActions.handleEditTask(null);
                      taskActions.setShowTaskForm(true);
                    }}
                    className="btn-primary py-2"
                  >
                    <Plus size={18} />
                    Add Task
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {tasks.length ? (
                  tasks.map((task, index) => (
                    <div
                      key={task._id}
                      className="animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TaskCard
                        task={task}
                        canEdit={!roles.isViewer}
                        onEdit={taskActions.handleEditTask}
                        onUpdate={reloadAll}
                      />
                    </div>
                  ))
                ) : (
                  <div className="card p-8 text-center">
                    <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-7 h-7 text-primary-500" />
                    </div>
                    <p className="text-dark-800 font-medium mb-1">No tasks yet</p>
                    <p className="text-surface-300 text-sm">
                      Create your first task to get started
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="border-t border-surface-100 bg-white p-6 max-h-80 overflow-y-auto custom-scrollbar">
              <MemberList
                groupId={id}
                members={members}
                isOwner={roles.isOwner}
                canManageMembers={roles.canManageMembers}
                onUpdate={reloadAll}
              />
            </div>
          </div>
        </div>

        {/* -------- DRAGGABLE CHAT BUTTON -------- */}
        <button
          onClick={() => setShowChat(!showChat)}
          onMouseDown={handleMouseDown}
          className="fab"
          style={{ left: position.x, top: position.y }}
        >
          <MessageCircle size={24} />
        </button>

        {showChat && (
          <div className="fixed bottom-20 right-6 z-50 animate-scale-in">
            <ChatPanel groupId={id} onClose={() => setShowChat(false)} />
          </div>
        )}

        {/* -------- MODALS -------- */}
        {taskActions.showTaskForm && (
          <TaskForm
            groupId={id}
            task={taskActions.editingTask}
            members={members}
            onClose={taskActions.handleTaskFormClose}
            onSuccess={taskActions.handleTaskFormSuccess}
          />
        )}

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

        {showHistory && (
          <PanelList
            title="Activity History"
            items={history}
            onClose={() => setShowHistory(false)}
            renderItem={(n) => (
              <>
                <p className="font-semibold text-sm text-dark-800">{n.action}</p>
                {n.details && <p className="text-xs text-surface-300">{n.details}</p>}
                <p className="text-xs text-surface-300 mt-1">
                  {n.performedBy?.name || 'Unknown'} • {formatTime(n.createdAt)}
                </p>
              </>
            )}
          />
        )}

        {/* Announcement Modal */}
        {showAnnouncement && (
          <AnnouncementModal groupId={id} onClose={() => setShowAnnouncement(false)} />
        )}

        {groupActions.showEditGroup && (
          <GroupForm
            group={group}
            onClose={groupActions.handleEditGroupClose}
            onSuccess={groupActions.handleEditGroupSuccess}
          />
        )}

        <ConfirmDialog
          isOpen={groupActions.showDeleteConfirm}
          title="Delete Group"
          message={`Are you sure you want to delete "${group.name}"?`}
          confirmText={groupActions.deleting ? 'Deleting...' : 'Delete'}
          onConfirm={groupActions.handleDeleteGroup}
          onCancel={() => groupActions.setShowDeleteConfirm(false)}
          danger
        />

        {groupActions.showLeaveModal && (
          <LeaveGroupModal
            group={group}
            members={members}
            isOwner={roles.isOwner}
            onClose={() => groupActions.setShowLeaveModal(false)}
            onSuccess={() => navigate('/')}
          />
        )}

        {groupActions.showShareProgress && (
          <ChatModal
            title="Share Your Progress"
            placeholder="Write what you accomplished..."
            value={progressText}
            setValue={setProgressText}
            buttonText="Share"
            buttonColor="bg-accent-500"
            onClose={() => groupActions.setShowShareProgress(false)}
            onSubmit={groupActions.handleShareProgress}
          />
        )}
      </div>
    </GroupProvider>
  );
}