import { useState, useEffect, useMemo } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/shared/Toast'
import { Card, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CalendarView } from '../components/shared/CalendarView'
import type { DashboardData, Task } from '@shared/types'

interface DashboardPageProps {
  onNavigate?: (page: string, projectId?: string) => void
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { accessToken } = useAuth()
  const { addToast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [allTasks, setAllTasks] = useState<Task[]>([])
  const [allProjects, setAllProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [projectSearch, setProjectSearch] = useState('')
  const [showProjectDropdown, setShowProjectDropdown] = useState(false)

  useEffect(() => {
    if (!accessToken) return
    api.getDashboard(accessToken)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken) return
    api.getProjects(accessToken).then(res => {
      setAllProjects(res.projects.map(p => ({ id: p.id, name: p.name })))
    }).catch(() => {})
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || allProjects.length === 0) return
    const taskParams: { limit: number; project_ids?: string } = { limit: 500 }
    if (selectedProjectIds.length > 0) {
      taskParams.project_ids = selectedProjectIds.join(',')
    } else {
      taskParams.project_ids = allProjects.map(p => p.id).join(',')
    }
    api.getTasks(accessToken, taskParams).then(res => setAllTasks(res.tasks)).catch(() => {})
  }, [accessToken, selectedProjectIds, allProjects])

  const filteredTasks = useMemo(() => {
    if (selectedProjectIds.length === 0) return allTasks
    return allTasks.filter(t => selectedProjectIds.includes(t.project_id))
  }, [allTasks, selectedProjectIds])

  const toggleProject = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleTaskClick = (task: Task) => {
    onNavigate?.('project-detail', task.project_id)
  }

  const handleTaskDragUpdate = async (id: string, updates: Partial<Task>) => {
    if (!accessToken) return
    try {
      await api.updateTask(accessToken, id, updates)
      setAllTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    } catch {
      addToast('error', 'Failed to update task date')
    }
  }

  const filteredProjectOptions = useMemo(() => {
    if (!projectSearch) return allProjects
    return allProjects.filter(p =>
      p.name.toLowerCase().includes(projectSearch.toLowerCase())
    )
  }, [allProjects, projectSearch])

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="app-loading__text">Loading dashboard...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="dashboard-loading">
        <div className="app-loading__text">Failed to load dashboard</div>
      </div>
    )
  }

  const { my_tasks, project_summary, recent_activity } = data

  return (
    <div className="dashboard">
      <div className="dashboard-stats">
        <StatCard label="Total Projects" value={project_summary.total_projects} icon={<IconFolder />} color="brand" />
        <StatCard label="Total Tasks" value={project_summary.total_tasks} icon={<IconList />} color="info" />
        <StatCard label="Completed" value={project_summary.completed_tasks} icon={<IconCheck />} color="success" />
        <StatCard label="Overdue" value={project_summary.overdue_tasks} icon={<IconAlert />} color="danger" />
      </div>

      <div className="dashboard-grid">
        <Card>
          <CardHeader title="My Tasks" subtitle="Your task overview" />
          <div className="dashboard-stat-rows">
            <TaskStatRow label="Due Today" count={my_tasks.due_today} variant="warning" />
            <TaskStatRow label="Overdue" count={my_tasks.overdue} variant="danger" />
            <TaskStatRow label="Completed" count={my_tasks.completed} variant="success" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Project Progress" subtitle="Overall completion" />
          <div className="donut-wrapper">
            <div className="donut-container">
              <svg className="donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#E0E0E0" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="var(--color-success-500)" strokeWidth="8"
                  strokeDasharray={`${(project_summary.completed_tasks / Math.max(project_summary.total_tasks, 1)) * 264} 264`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="donut-center">
                <span className="donut-center__text">
                  {Math.round((project_summary.completed_tasks / Math.max(project_summary.total_tasks, 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div className="donut-legend">
            <span className="donut-legend__item">
              <span className="donut-legend__dot donut-legend__dot--completed" /> Completed
            </span>
            <span className="donut-legend__item">
              <span className="donut-legend__dot donut-legend__dot--remaining" /> Remaining
            </span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest updates" />
          <div className="activity-list">
            {recent_activity.length === 0 ? (
              <p className="activity-empty">No recent activity</p>
            ) : (
              recent_activity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-item__dot" />
                  <div className="activity-item__content">
                    <p className="activity-item__message">{item.message}</p>
                    <p className="activity-item__time">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Task Calendar" subtitle="All tasks across projects" />
        <div className="dashboard-calendar-filters">
          <div className="dashboard-calendar-chips">
            <button
              className={`project-chip${selectedProjectIds.length === 0 ? ' project-chip--active' : ''}`}
              onClick={() => setSelectedProjectIds([])}
            >
              All Projects
            </button>
            {selectedProjectIds.map(id => {
              const p = allProjects.find(proj => proj.id === id)
              if (!p) return null
              return (
                <button key={id} className="project-chip project-chip--active" onClick={() => toggleProject(id)}>
                  {p.name} <IconX className="project-chip__x" />
                </button>
              )
            })}
          </div>
          <div className="dashboard-calendar-add" style={{ position: 'relative' }}>
            <button
              className="dashboard-calendar-add-btn"
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            >
              <IconPlus />
            </button>
            {showProjectDropdown && (
              <>
                <div className="dashboard-calendar-overlay" onClick={() => setShowProjectDropdown(false)} />
                <div className="dashboard-calendar-dropdown">
                  <input
                    type="text"
                    className="dashboard-calendar-search"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="dashboard-calendar-options">
                    {filteredProjectOptions.map(p => {
                      const isSelected = selectedProjectIds.includes(p.id)
                      return (
                        <button
                          key={p.id}
                          className={`dashboard-calendar-option${isSelected ? ' dashboard-calendar-option--selected' : ''}`}
                          onClick={() => { toggleProject(p.id); setProjectSearch('') }}
                        >
                          <span className="dashboard-calendar-check">
                            {isSelected ? <IconCheckSmall /> : null}
                          </span>
                          {p.name}
                        </button>
                      )
                    })}
                    {filteredProjectOptions.length === 0 && (
                      <div className="dashboard-calendar-options-empty">No projects found</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <CalendarView
          tasks={filteredTasks}
          onSelectTask={handleTaskClick}
          onUpdateTask={handleTaskDragUpdate}
          onQuickAdd={() => {}}
        />
      </Card>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card padding="md">
      <div className="stat-card__inner">
        <div>
          <p className="stat-card__label">{label}</p>
          <p className="stat-card__value">{value}</p>
        </div>
        <div className={`stat-card__icon stat-card__icon--${color}`}>
          {icon}
        </div>
      </div>
    </Card>
  )
}

function TaskStatRow({ label, count, variant }: { label: string; count: number; variant: string }) {
  return (
    <div className="task-stat-row">
      <span className="task-stat-row__label">{label}</span>
      <Badge variant={variant as 'warning' | 'danger' | 'success'}>{count}</Badge>
    </div>
  )
}

function IconX({ className = '' }: { className?: string }) { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconPlus({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconCheckSmall() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconFolder() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> }
function IconList() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconCheck() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function IconAlert() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }