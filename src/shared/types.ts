// Shared types between main (API) and renderer (frontend)

export type Role = 'admin' | 'project_manager' | 'team_member'
export type ProjectStatus = 'active' | 'archived'
export type TaskStatus = 'pending' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  company?: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  description?: string
  created_by: string
  member_count?: number
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  name?: string
  email?: string
  role?: Role
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  owner_id: string
  team_id?: string
  status: ProjectStatus
  start_date?: string
  end_date?: string
  task_count?: number
  completed_count?: number
  created_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description?: string
  assignee_id?: string
  assignee_name?: string
  assignee_initials?: string
  status: TaskStatus
  priority: TaskPriority
  start_date?: string
  due_date?: string
  estimated_hours?: number
  created_by: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  user_name: string
  message: string
  created_at: string
}

export interface Attachment {
  id: string
  task_id: string
  filename: string
  path: string
  uploaded_by: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  message: string
  is_read: boolean
  created_at: string
}

export interface ActivityItem {
  id: string
  type: string
  message: string
  created_at: string
}

export interface DashboardData {
  my_tasks: {
    due_today: number
    overdue: number
    completed: number
  }
  project_summary: {
    total_projects: number
    total_tasks: number
    completed_tasks: number
    overdue_tasks: number
  }
  recent_activity: ActivityItem[]
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  validation_errors?: { field: string; message: string }[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}
