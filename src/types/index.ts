export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'link' | 'gdrive' | 'gdoc' | 'gsheet' | 'file';
  size?: string;
  uploadedAt: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  attachment?: TaskAttachment;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm
  durationMinutes: number;
  assignedTo?: string; // User ID
  spaceId: string;
  tags?: string[];
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'Admin' | 'Member' | 'Guest';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  team: string;
  weeklyCapacityHours?: number;
}

export interface Team {
  id: string;
  name: string;
  division: string;
  leaderId: string;
}

export interface Space {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  durationMinutes: number;
  logDate: string;
  notes?: string;
  createdAt: string;
}

export interface InboxNotification {
  id: string;
  title: string;
  message: string;
  type: 'assignment' | 'due' | 'mention' | 'system';
  read: boolean;
  timestamp: string;
  taskId?: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface DirectMessage {
  id: string;
  recipientId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export type ActiveTab = 'home' | 'planner' | 'teams' | 'ai' | 'settings' | 'inbox' | 'channels' | 'dm';
export type MyTasksFilter = 'all' | 'assigned_to_me' | 'today_overdue' | 'personal';
