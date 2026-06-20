import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusPill } from '../components/shared/StatusPill'
import { PriorityBadge } from '../components/shared/PriorityBadge'
import { Avatar } from '../components/shared/Avatar'
import type { Project, Task, TaskStatus, TaskPriority } from '@shared/types'

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskParentId, setNewTaskParentId] = useState('')

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

  const resetCreateForm = () => {
    setNewTaskTitle('')
    setNewTaskDesc('')
    setNewTaskPriority('medium')
    setNewTaskDueDate('')
    setNewTaskParentId('')
    setShowCreateTask(false)
  }

  const handleCreateTask = async () => {
    if (!accessToken || !newTaskTitle.trim()) return
    try {
      await api.createTask(accessToken, {
        project_id: projectId,
        title: newTaskTitle,
        description: newTaskDesc || undefined,
        priority: newTaskPriority,
        due_date: newTaskDueDate || undefined,
        parent_id: newTaskParentId || undefined,
      })
      resetCreateForm()
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!accessToken) return
    try {
      await api.updateTask(accessToken, taskId, updates)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
      if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!accessToken) return
    if (!confirm('Delete this task?')) return
    try {
      await api.deleteTask(accessToken, taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      if (selectedTask?.id === taskId) setSelectedTask(null)
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    await handleUpdateTask(taskId, { status })
  }

  const handlePriorityChange = async (taskId: string, priority: TaskPriority) => {
    await handleUpdateTask(taskId, { priority })
  }

  const topLevelTasks = tasks.filter(t => !t.parent_id)
  const childTasks = tasks.filter(t => t.parent_id)

  const filteredTasks = topLevelTasks.filter(t => {
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
    return <div className="detail-loading"><span className="app-loading__text">Loading project...</span></div>
  }

  if (!project) {
    return <div className="detail-loading"><span className="app-loading__text">Project not found</span></div>
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
          <FilterPill label="Priority" value={filterPriority || 'All'} onClick={() => setFilterPriority(filterPriority ? '' : 'high')} />
          <FilterPill label="Status" value={filterStatus || 'All'} onClick={() => setFilterStatus(filterStatus ? '' : 'pending')} />
        </div>
        <Button size="sm" onClick={() => setShowCreateTask(true)}>
          <IconPlus /> Add New
        </Button>
      </div>

      {showCreateTask && (
        <Card>
          <h3 className="detail-create-task__title">Create New Task</h3>
          <div className="detail-create-body">
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
        <div className="detail-task-groups">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(status => (
            <TaskGroup
              key={status}
              status={status}
              tasks={groupedTasks[status]}
              childTasks={childTasks}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDelete={handleDeleteTask}
              onSelect={setSelectedTask}
              onEdit={setEditingTask}
            />
          ))}
        </div>
      )}

      {/* Board View */}
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
        <div className="detail-overview-grid">
          <Card>
            <p className="detail-stat-label">Total Tasks</p>
            <p className="detail-stat-value">{tasks.length}</p>
            <p className="detail-stat-label">Total Tasks</p>
            <p className="detail-stat-value">{tasks.length}</p>
          </Card>
          <Card>
            <p className="detail-stat-label">Completed</p>
            <p className="detail-stat-value detail-stat-value--success">{groupedTasks.completed.length}</p>
            <p className="detail-stat-label">Completed</p>
            <p className="detail-stat-value detail-stat-value--success">{groupedTasks.completed.length}</p>
          </Card>
          <Card>
            <p className="detail-stat-label">In Progress</p>
            <p className="detail-stat-value detail-stat-value--warning">{groupedTasks.in_progress.length}</p>
            <p className="detail-stat-label">In Progress</p>
            <p className="detail-stat-value detail-stat-value--warning">{groupedTasks.in_progress.length}</p>
          </Card>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__header-left">
                <h2 className="modal__title">{selectedTask.title}</h2>
                {selectedTask.description && <p className="modal__desc">{selectedTask.description}</p>}
              </div>
              <button onClick={() => setSelectedTask(null)} className="modal__close"><IconX /></button>
            </div>
            <div className="modal__body">
              <div className="modal__grid">
                <div>
                  <label className="modal__label">Status</label>
                  <select value={selectedTask.status} onChange={e => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)} className="detail-task-select">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="modal__label">Priority</label>
                  <select value={selectedTask.priority} onChange={e => handlePriorityChange(selectedTask.id, e.target.value as TaskPriority)} className="detail-task-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="modal__label">Due Date</label>
                  <input type="date" value={selectedTask.due_date ? selectedTask.due_date.split('T')[0] : ''} onChange={e => handleUpdateTask(selectedTask.id, { due_date: e.target.value || undefined })} className="detail-task-select" />
                </div>
                <div>
                  <label className="modal__label">Assignee</label>
                  <span className="modal__assignee">
                    {selectedTask.assignee_name ? <Avatar name={selectedTask.assignee_name} size="sm" /> : <span className="text-text-tertiary">Unassigned</span>}
                  </span>
                </div>
              </div>

              {/* Subtasks */}
              {childTasks.filter(ct => ct.parent_id === selectedTask.id).length > 0 && (
                <div className="modal__subtasks">
                  <h4 className="modal__subtasks-title">Subtasks</h4>
                  {childTasks.filter(ct => ct.parent_id === selectedTask.id).map(child => (
                    <div key={child.id} className="modal__subtask">
                      <button onClick={() => handleStatusChange(child.id, child.status === 'completed' ? 'pending' : 'completed')} className="task-title__checkbox">
                        {child.status === 'completed' ? <IconCheckCircle className="task-title__checkbox--completed" /> : <IconCircle />}
                      </button>
                      <span className={`modal__subtask-title${child.status === 'completed' ? ' modal__subtask-title--completed' : ''}`}>{child.title}</span>
                      <PriorityBadge priority={child.priority} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal__footer">
              <Button variant="danger" size="sm" onClick={() => { handleDeleteTask(selectedTask.id); setSelectedTask(null); }}>
                <IconTrash /> Delete
              </Button>
              <Button size="sm" onClick={() => { setEditingTask(selectedTask); setSelectedTask(null); }}>
                <IconEdit /> Edit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay" onClick={() => setEditingTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <h2 className="modal__title">Edit Task</h2>
              <button onClick={() => setEditingTask(null)} className="modal__close"><IconX /></button>
            </div>
            <div className="modal__body">
              <Input placeholder="Task title" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
              <textarea placeholder="Description" value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="detail-create-desc" />
              <div className="detail-create-row">
                <div>
                  <label className="detail-create-label">Priority</label>
                  <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })} className="detail-task-select">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="detail-create-label">Due Date</label>
                  <input type="date" value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''} onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value || undefined })} className="detail-task-select" />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <Button variant="ghost" size="sm" onClick={() => setEditingTask(null)}>Cancel</Button>
              <Button size="sm" onClick={() => {
                handleUpdateTask(editingTask.id, { title: editingTask.title, description: editingTask.description, priority: editingTask.priority, due_date: editingTask.due_date })
                setEditingTask(null)
              }}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TaskGroup({ status, tasks, childTasks, onStatusChange, onPriorityChange, onDelete, onSelect, onEdit }: {
  status: TaskStatus; tasks: Task[]; childTasks: Task[]
  onStatusChange: (id: string, s: TaskStatus) => void
  onPriorityChange: (id: string, p: TaskPriority) => void
  onDelete: (id: string) => void
  onSelect: (t: Task) => void
  onEdit: (t: Task) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card padding="none" className="task-group">
      <div className="task-group__header">
        <div className="task-group__header-left">
          <button onClick={() => setExpanded(!expanded)} className="task-group__toggle">
            <IconChevronDown className={`task-group__toggle-icon${expanded ? '' : ' task-group__toggle-icon--collapsed'}`} />
    <Card padding="none" className="task-group">
      <div className="task-group__header">
        <div className="task-group__header-left">
          <button onClick={() => setExpanded(!expanded)} className="task-group__toggle">
            <IconChevronDown className={`task-group__toggle-icon${expanded ? '' : ' task-group__toggle-icon--collapsed'}`} />
          </button>
          <StatusPill status={status} />
          <span className="task-group__count">({tasks.length})</span>
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

function TaskCard({ task, childTasks, onStatusChange, onPriorityChange, onDelete, onSelect }: {
  task: Task; childTasks: Task[]
  onStatusChange: (id: string, s: TaskStatus) => void
  onPriorityChange: (id: string, p: TaskPriority) => void
  onDelete: (id: string) => void
  onSelect: (t: Task) => void
}) {
  return (
    <Card padding="sm" className="board-card" onClick={() => onSelect(task)}>
      <div className="board-card__header">
        <h4 className="board-card__title">{task.title}</h4>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }} className="task-action-btn task-action-btn--danger"><IconTrash className="w-3 h-3" /></button>
      </div>
      <div className="board-card__meta">
        <select value={task.priority} onClick={e => e.stopPropagation()} onChange={e => onPriorityChange(task.id, e.target.value as TaskPriority)} className="detail-task-select detail-task-select--sm">
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        {task.due_date && <span className="task-date">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>
      <div className="board-card__footer">
        <button onClick={e => { e.stopPropagation(); const n: Record<TaskStatus, TaskStatus> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }; onStatusChange(task.id, n[task.status]); }}>
          {task.status === 'completed' ? <IconCheckCircle className="task-title__checkbox--completed w-4 h-4" /> : task.status === 'in_progress' ? <IconCircleHalf className="task-title__checkbox--in_progress w-4 h-4" /> : <IconCircle className="w-4 h-4" />}
        </button>
        {childTasks.length > 0 && <span className="task-title__subtasks">{childTasks.filter(c => c.status === 'completed').length}/{childTasks.length}</span>}
        {task.assignee_name && <Avatar name={task.assignee_name} size="sm" />}
      </div>
    </Card>
  )
}

function FilterPill({ label, value, onClick }: { label: string; value: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="filter-pill">
      {label} <span className="filter-pill__value">{value}</span>
      <IconChevronDown />
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
function IconCircleHalf({ className = '' }: { className?: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5" className={className}><circle cx="12" cy="12" r="10"/></svg> }
function IconCheckCircle({ className = '' }: { className?: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="white" strokeWidth="2"/></svg> }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconEdit() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconTrash() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> }
function IconUserCircle() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function IconFlag() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"/></svg> }