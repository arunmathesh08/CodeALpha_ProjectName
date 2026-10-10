export interface User {
  id: string;
  name: string;
  email: string;
  gender?: string;
  avatar?: string;
  createdAt?: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: User;
}

export interface Column {
  id: string;
  name: string;
  order: number;
  boardId: string;
  tasks?: Task[];
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  columns: Column[];
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  order: number;
  dueDate?: string;
  columnId: string;
  projectId: string;
  creatorId: string;
  creator?: User;
  assigneeId?: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
  column?: Column;
  project?: { id: string; name: string };
  comments?: Comment[];
  _count?: {
    comments: number;
  };
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  user: User;
  project?: { id: string; name: string };
  action: string;
  details?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  ownerId: string;
  owner?: User;
  members?: ProjectMember[];
  boards?: Board[];
  activities?: Activity[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
  };
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  overdueTasks: number;
  totalTasks: number;
}
