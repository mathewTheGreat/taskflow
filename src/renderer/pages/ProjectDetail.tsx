import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { StatusPill } from '../components/shared/StatusPill'
import { PriorityBadge } from '../components/shared/PriorityBadge'
import { Avatar } from '../components/shared/Avatar'
import type { Project, Task, TaskStatus } from '@shared/types'

interface ProjectDetailPageProps {
  projectId: string
  onBack: () => void
}

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const { accessToken } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')

  const loadData = async () => {
    if (!accessToken) return
    try {
      const [projectData, tasksData] = await Promise.all([
        api.getProject(accessToken, projectId),
        api.getTasks(accessToken, { project_id: projectId }),
      ])
      setProject(projectData)
      setTasks(tasksData.tasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [accessToken, projectId])

  const handleCreateTask = async () => {
    if (!accessToken || !newTaskTitle.trim()) return
    try {
      await api.createTask(accessToken, {
        project_id: projectId,
        title: newTaskTitle,
        priority: newTaskPriority,
      })
      setNewTaskTitle('')
      setNewTaskPriority('medium')
      setShowCreateTask(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    if (!accessToken) return
    try {
      await api.updateTask(accessToken, taskId, { status })
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t))
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTasks = tasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    return true
  })

  const groupedTasks: Record<TaskStatus, Task[]> = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  }

  if (loading) {
    return <div className="detail-loading"><span className="app-loading__text">Loading project...</span></div>
  }

  if (!project) {
    return <div className="detail-loading"><span className="app-loading__text">Project not found</span></div>
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <IconClock /> },
    { id: 'list', label: 'List', icon: <IconList /> },
    { id: 'board', label: 'Board', icon: <IconBoard /> },
    { id: 'calendar', label: 'Calendar', icon: <IconCalendar /> },
    { id: 'files', label: 'Files', icon: <IconFile /> },
  ]

  return (
    <div>
      <div className="detail-header">
        <div className="detail-header__left">
          <button onClick={onBack} className="detail-back">
            <IconArrowLeft />
          </button>
          <div>
            <h1 className="detail-name">{project.name}</h1>
            {project.description && (
              <p className="detail-desc">{project.description}</p>
            )}
          </div>
        </div>
        <div className="detail-header__actions">
          <Button variant="secondary" size="sm" onClick={() => {}}>Share</Button>
          <Button variant="secondary" size="sm" onClick={() => {}}>Automation</Button>
        </div>
      </div>

      <div className="detail-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`detail-tab${activeTab === tab.id ? ' detail-tab--active' : ''}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="detail-filters">
        <div className="detail-filters__group">
          <FilterPill label="Due Date" value="All" onClick={() => {}} />
          <FilterPill label="Assignee" value="All" onClick={() => {}} />
          <FilterPill
            label="Priority"
            value={filterPriority || 'All'}
            onClick={() => setFilterPriority(filterPriority ? '' : 'high')}
          />
          <FilterPill
            label="Status"
            value={filterStatus || 'All'}
            onClick={() => setFilterStatus(filterStatus ? '' : 'pending')}
          />
        </div>
        <Button size="sm" onClick={() => setShowCreateTask(true)}>
          <IconPlus /> Add New
        </Button>
      </div>

      {showCreateTask && (
        <Card>
          <h3 className="detail-create-task__title">Create New Task</h3>
          <div className="detail-create-body">
            <Input placeholder="Task title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
            <div className="detail-create-priority">
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="detail-task-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div className="create-form__actions">
              <Button variant="ghost" size="sm" onClick={() => setShowCreateTask(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'list' && (
        <div className="detail-task-groups">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(status => (
            <TaskGroup
              key={status}
              status={status}
              tasks={groupedTasks[status]}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {activeTab === 'board' && (
        <Card className="placeholder-page">
          <p className="placeholder-page__text">Board view coming in Phase 2</p>
        </Card>
      )}

      {activeTab === 'calendar' && (
        <Card className="placeholder-page">
          <p className="placeholder-page__text">Calendar view coming in Phase 2</p>
        </Card>
      )}

      {activeTab === 'files' && (
        <Card className="placeholder-page">
          <p className="placeholder-page__text">File management coming in Phase 2</p>
        </Card>
      )}

      {activeTab === 'overview' && (
        <div className="detail-overview-grid">
          <Card>
            <p className="detail-stat-label">Total Tasks</p>
            <p className="detail-stat-value">{tasks.length}</p>
          </Card>
          <Card>
            <p className="detail-stat-label">Completed</p>
            <p className="detail-stat-value detail-stat-value--success">{groupedTasks.completed.length}</p>
          </Card>
          <Card>
            <p className="detail-stat-label">In Progress</p>
            <p className="detail-stat-value detail-stat-value--warning">{groupedTasks.in_progress.length}</p>
          </Card>
        </div>
      )}
    </div>
  )
}

function TaskGroup({ status, tasks, onStatusChange }: { status: TaskStatus; tasks: Task[]; onStatusChange: (id: string, status: TaskStatus) => void }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card padding="none" className="task-group">
      <div className="task-group__header">
        <div className="task-group__header-left">
          <button onClick={() => setExpanded(!expanded)} className="task-group__toggle">
            <IconChevronDown className={`task-group__toggle-icon${expanded ? '' : ' task-group__toggle-icon--collapsed'}`} />
          </button>
          <StatusPill status={status} />
          <span className="task-group__count">({tasks.length})</span>
        </div>
        <button className="task-group__actions">
          <IconDots />
        </button>
      </div>

      {expanded && (
        <>
          {tasks.length > 0 ? (
            <table className="task-table">
              <thead>
                <tr className="task-table__header-row">
                  <th className="task-table__header-cell task-table__header-cell--name">Name</th>
                  <th className="task-table__header-cell task-table__header-cell--assignee">Assignee</th>
                  <th className="task-table__header-cell task-table__header-cell--due">Due Date</th>
                  <th className="task-table__header-cell task-table__header-cell--priority">Priority</th>
                  <th className="task-table__header-cell task-table__header-cell--actions"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="task-row">
                    <td className="task-row__cell">
                      <div className="task-title">
                        <button
                          onClick={() => {
                            const nextStatus: Record<TaskStatus, TaskStatus> = {
                              pending: 'in_progress',
                              in_progress: 'completed',
                              completed: 'pending',
                            }
                            onStatusChange(task.id, nextStatus[task.status])
                          }}
                          className="task-title__checkbox"
                        >
                          {task.status === 'completed' ? (
                            <IconCheckCircle className="task-title__checkbox--completed" />
                          ) : task.status === 'in_progress' ? (
                            <IconCircleHalf className="task-title__checkbox--in_progress" />
                          ) : (
                            <IconCircle />
                          )}
                        </button>
                        <span className={`task-title__text${task.status === 'completed' ? ' task-title__text--completed' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="task-row__cell">
                      {task.assignee_name ? (
                        <Avatar name={task.assignee_name} size="sm" />
                      ) : (
                        <span className="task-assignee--empty">
                          <IconUserCircle /> Assign
                        </span>
                      )}
                    </td>
                    <td className="task-row__cell">
                      <span className={task.due_date ? 'task-date' : 'task-date--empty'}>
                        {task.due_date ? (
                          new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        ) : (
                          <><IconCalendar /> Add date</>
                        )}
                      </span>
                    </td>
                    <td className="task-row__cell">
                      {task.priority === 'high' || task.priority === 'medium' ? (
                        <PriorityBadge priority={task.priority} />
                      ) : (
                        <span className="priority-badge priority-badge--low">
                          <IconFlag />
                        </span>
                      )}
                    </td>
                    <td className="task-row__cell task-actions" onClick={() => {}}>⋯</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="task-group__empty">No tasks</div>
          )}
          <div onClick={() => {}} className="task-group__add">
            <IconPlus /> Add Task
          </div>
        </>
      )}
    </Card>
  )
}

function FilterPill({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="filter-pill">
      {label} <span className="filter-pill__value">{value}</span>
      <IconChevronDown />
    </button>
  )
}

function IconClock() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconList() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconBoard() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function IconCalendar() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IconFile() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function IconArrowLeft() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> }
function IconPlus({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconChevronDown({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg> }
function IconDots() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> }
function IconCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> }
function IconCircleHalf({ className = '' }: { className?: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5" className={className}><circle cx="12" cy="12" r="10"/></svg> }
function IconCheckCircle({ className = '' }: { className?: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="white" strokeWidth="2"/></svg> }
function IconUserCircle() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IconFlag() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/></svg> }