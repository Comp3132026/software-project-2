import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com',
};

// Mock auth context value
export const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  loading: false,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  setUser: vi.fn(),
};

// Mock group data
export const mockGroup = {
  _id: 'group123',
  name: 'Test Group',
  description: 'A test group',
  owner: { _id: 'user123', name: 'Test User' },
  memberCount: 3,
  taskCount: 5,
  completionRate: 60,
  activeCount: 2,
  inactiveCount: 1,
  unresponsiveCount: 0,
};

// Mock member data
export const mockMembers = [
  {
    _id: 'member1',
    userId: 'user123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'owner',
    status: 'active',
    isSuspended: false,
  },
  {
    _id: 'member2',
    userId: 'user456',
    name: 'Member Two',
    email: 'member2@example.com',
    role: 'moderator',
    status: 'active',
    isSuspended: false,
  },
  {
    _id: 'member3',
    userId: 'user789',
    name: 'Member Three',
    email: 'member3@example.com',
    role: 'member',
    status: 'inactive',
    isSuspended: false,
  },
];

// Mock task data
export const mockTasks = [
  {
    _id: 'task1',
    title: 'Complete project',
    description: 'Finish the project by end of week',
    status: 'pending',
    priority: 'high',
    dueDate: '2025-12-10T00:00:00.000Z',
    assignedTo: [{ _id: 'user123', name: 'Test User' }],
    isHabit: false,
    group: { _id: 'group123', name: 'Test Group' },
  },
  {
    _id: 'task2',
    title: 'Daily standup',
    description: 'Attend daily standup meeting',
    status: 'completed',
    priority: 'medium',
    dueDate: '2025-12-05T00:00:00.000Z',
    assignedTo: [{ _id: 'user456', name: 'Member Two' }],
    isHabit: true,
    frequency: 'daily',
    group: { _id: 'group123', name: 'Test Group' },
  },
  {
    _id: 'task3',
    title: 'Review code',
    description: 'Review pull requests',
    status: 'pending',
    priority: 'low',
    dueDate: '2025-12-01T00:00:00.000Z', // Overdue
    assignedTo: [{ _id: 'user789', name: 'Member Three' }],
    isHabit: false,
    group: { _id: 'group123', name: 'Test Group' },
  },
];

// Mock notification data
export const mockNotifications = [
  {
    _id: 'notif1',
    message: 'New task assigned to you',
    isRead: false,
    createdAt: '2025-12-05T10:00:00.000Z',
  },
  {
    _id: 'notif2',
    message: 'Task completed',
    isRead: true,
    createdAt: '2025-12-04T15:00:00.000Z',
  },
];

// All Providers wrapper for testing
const AllProviders = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Custom render function with providers
const customRender = (ui, options) => render(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Helper to create mock API response
export const createMockResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

// Helper to wait for async operations
export const waitForLoadingToFinish = () => new Promise((resolve) => setTimeout(resolve, 0));
