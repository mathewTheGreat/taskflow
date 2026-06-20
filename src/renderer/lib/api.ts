const API_BASE = 'http://localhost:3001/api'

interface FetchOptions {
  method?: string
  body?: unknown
  token?: string | null
  credentials?: RequestCredentials
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, token, credentials = 'include' } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  console.debug('[API] request', { url: `${API_BASE}${path}`, method, body, token: Boolean(token) })

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (fetchError) {
    console.error('[API] network error', fetchError)
    const error = new Error('Unable to reach the server. Check your connection and try again.') as Error & { status?: number }
    error.status = 0
    throw error
  }

  const data = await res.json().catch(() => null)
  console.debug('[API] response', { url: `${API_BASE}${path}`, status: res.status, data })

  if (!res.ok) {
    const message = data?.error || `API error: ${res.status}`
    const error = new Error(message) as Error & { status: number; validationErrors?: unknown[] }
    error.status = res.status
    error.validationErrors = data?.validation_errors
    throw error
  }

  return data as T
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (data: { name: string; email: string; password: string; company?: string }) =>
    apiFetch<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: data,
    }),

  refresh: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  logout: (token: string | null) =>
    apiFetch<{ message: string }>('/auth/logout', {
      method: 'POST',
      token,
    }),

  // Users
  getMe: (token: string) =>
    apiFetch<User>('/users/me', { token }),

  // Dashboard
  getDashboard: (token: string) =>
    apiFetch<DashboardData>('/dashboard', { token }),

  // Teams
  getTeams: (token: string) =>
    apiFetch<{ teams: Team[] }>('/teams', { token }),

  createTeam: (token: string, data: { name: string; description?: string }) =>
    apiFetch<Team>('/teams', { method: 'POST', body: data, token }),

  getTeam: (token: string, id: string) =>
    apiFetch<Team & { members: User[] }>(`/teams/${id}`, { token }),

  updateTeam: (token: string, id: string, data: { name: string; description?: string }) =>
    apiFetch<Team>(`/teams/${id}`, { method: 'PUT', body: data, token }),

  deleteTeam: (token: string, id: string) =>
    apiFetch<void>(`/teams/${id}`, { method: 'DELETE', token }),

  addTeamMember: (token: string, teamId: string, userId: string) =>
    apiFetch<unknown>(`/teams/${teamId}/members`, { method: 'POST', body: { user_id: userId }, token }),

  removeTeamMember: (token: string, teamId: string, userId: string) =>
    apiFetch<void>(`/teams/${teamId}/members/${userId}`, { method: 'DELETE', token }),

  // Projects
  getProjects: (token: string, params?: { team_id?: string; status?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.team_id) qs.set('team_id', params.team_id)
    if (params?.status) qs.set('status', params.status)
    if (params?.search) qs.set('search', params.search)
    return apiFetch<{ projects: Project[]; total: number }>(`/projects?${qs}`, { token })
  },

  createProject: (token: string, data: { name: string; description?: string; team_id?: string; start_date?: string; end_date?: string }) =>
    apiFetch<Project>('/projects', { method: 'POST', body: data, token }),

  getProject: (token: string, id: string) =>
    apiFetch<Project>(`/projects/${id}`, { token }),

  updateProject: (token: string, id: string, data: { name?: string; description?: string; team_id?: string; status?: string }) =>
    apiFetch<Project>(`/projects/${id}`, { method: 'PUT', body: data, token }),

  deleteProject: (token: string, id: string) =>
    apiFetch<void>(`/projects/${id}`, { method: 'DELETE', token }),

  // Tasks
  getTasks: (token: string, params?: { project_id?: string; assignee_id?: string; status?: string; priority?: string; search?: string }) => {
    const qs = new URLSearchParams()
    if (params?.project_id) qs.set('project_id', params.project_id)
    if (params?.assignee_id) qs.set('assignee_id', params.assignee_id)
    if (params?.status) qs.set('status', params.status)
    if (params?.priority) qs.set('priority', params.priority)
    if (params?.search) qs.set('search', params.search)
    return apiFetch<{ tasks: Task[]; total: number }>(`/tasks?${qs}`, { token })
  },

  createTask: (token: string, data: { project_id: string; title: string; description?: string; assignee_id?: string; status?: string; priority?: string; due_date?: string; estimated_hours?: number }) =>
    apiFetch<Task>('/tasks', { method: 'POST', body: data, token }),

  getTask: (token: string, id: string) =>
    apiFetch<Task & { comments: Comment[] }>(`/tasks/${id}`, { token }),

  updateTask: (token: string, id: string, data: { title?: string; description?: string; assignee_id?: string; status?: string; priority?: string; due_date?: string }) =>
    apiFetch<Task>(`/tasks/${id}`, { method: 'PUT', body: data, token }),

  deleteTask: (token: string, id: string) =>
    apiFetch<void>(`/tasks/${id}`, { method: 'DELETE', token }),

  addComment: (token: string, taskId: string, message: string) =>
    apiFetch<Comment>(`/tasks/${taskId}/comments`, { method: 'POST', body: { message }, token }),

  getComments: (token: string, taskId: string) =>
    apiFetch<{ comments: Comment[] }>(`/tasks/${taskId}/comments`, { token }),
}

// Type aliases for use in the renderer
type User = import('@shared/types').User
type Team = import('@shared/types').Team
type Project = import('@shared/types').Project
type Task = import('@shared/types').Task
type Comment = import('@shared/types').Comment
type DashboardData = import('@shared/types').DashboardData
