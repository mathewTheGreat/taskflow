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
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [newTaskParentId, setNewTaskParentId] = useState('')

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
    setNewTaskAssignee('')
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
        assignee_id: newTaskAssignee || undefined,
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

  const groupedTasks: Record<TaskStatus, Task[]> = {
    pending: topLevelTasks.filter(t => t.status === 'pending'),
    in_progress: topLevelTasks.filter(t => t.status === 'in_progress'),
    completed: topLevelTasks.filter(t => t.status === 'completed'),
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-secondary">Loading project...</div>
  }

  if (!project) {
    return <div className="flex items-center justify-center h-64 text-text-secondary">Project not found</div>
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <IconChart /> },
    { id: 'list', label: 'List', icon: <IconList /> },
    { id: 'board', label: 'Board', icon: <IconBoard /> },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors">
            <IconArrowLeft />
          </button>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{project.name}</h1>
            {project.description && <p className="text-sm text-text-secondary">{project.description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => setShowCreateTask(true)}>
            <IconPlus /> Add Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 text-sm text-text-tertiary border-b border-border mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 pb-2.5 transition-colors ${
              activeTab === tab.id
                ? 'text-accent-500 font-semibold border-b-2 border-accent-500 -mb-px'
                : 'hover:text-text-secondary'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Create Task Form */}
      {showCreateTask && (
        <Card className="mb-4">
          <h3 className="font-semibold text-text-primary mb-3">Create New Task</h3>
          <div className="flex flex-col gap-3">
            <Input placeholder="Task title *" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
            <textarea
              placeholder="Description (optional)"
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
              className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-y"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={e => setNewTaskDueDate(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Parent Task</label>
                <select
                  value={newTaskParentId}
                  onChange={e => setNewTaskParentId(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary"
                >
                  <option value="">None (top-level)</option>
                  {topLevelTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={resetCreateForm}>Cancel</Button>
              <Button size="sm" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>Create Task</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <p className="text-sm text-text-secondary">Total Tasks</p>
            <p className="text-2xl font-bold text-text-primary mt-1">{tasks.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Pending</p>
            <p className="text-2xl font-bold text-warning-500 mt-1">{groupedTasks.pending.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">In Progress</p>
            <p className="text-2xl font-bold text-accent-500 mt-1">{groupedTasks.in_progress.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-text-secondary">Completed</p>
            <p className="text-2xl font-bold text-success-500 mt-1">{groupedTasks.completed.length}</p>
          </Card>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
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

      {/* Board Tab */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-3 gap-4">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(status => (
            <div key={status} className="bg-surface-secondary rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <StatusPill status={status} />
                <span className="text-xs text-text-tertiary">({groupedTasks[status].length})</span>
              </div>
              <div className="space-y-2">
                {groupedTasks[status].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    childTasks={childTasks.filter(ct => ct.parent_id === task.id)}
                    onStatusChange={handleStatusChange}
                    onPriorityChange={handlePriorityChange}
                    onDelete={handleDeleteTask}
                    onSelect={setSelectedTask}
                  />
                ))}
                {groupedTasks[status].length === 0 && (
                  <p className="text-xs text-text-tertiary text-center py-4">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedTask(null)}>
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-text-primary">{selectedTask.title}</h2>
                {selectedTask.description && (
                  <p className="text-sm text-text-secondary mt-1">{selectedTask.description}</p>
                )}
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-md hover:bg-surface-secondary text-text-secondary">
                <IconX />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Status</label>
                <select
                  value={selectedTask.status}
                  onChange={e => handleStatusChange(selectedTask.id, e.target.value as TaskStatus)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Priority</label>
                <select
                  value={selectedTask.priority}
                  onChange={e => handlePriorityChange(selectedTask.id, e.target.value as TaskPriority)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Due Date</label>
                <input
                  type="date"
                  value={selectedTask.due_date ? selectedTask.due_date.split('T')[0] : ''}
                  onChange={e => handleUpdateTask(selectedTask.id, { due_date: e.target.value || undefined })}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-tertiary mb-1 block">Assignee</label>
                <Input
                  placeholder="Unassigned"
                  value={selectedTask.assignee_name || ''}
                  onChange={() => {}}
                  disabled
                />
              </div>
            </div>

            {/* Subtasks */}
            {childTasks.filter(ct => ct.parent_id === selectedTask.id).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-text-primary mb-2">Subtasks</h4>
                <div className="space-y-2">
                  {childTasks.filter(ct => ct.parent_id === selectedTask.id).map(child => (
                    <div key={child.id} className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-md">
                      <button
                        onClick={() => handleStatusChange(child.id, child.status === 'completed' ? 'pending' : 'completed')}
                        className="text-text-tertiary hover:text-brand-500"
                      >
                        {child.status === 'completed' ? <IconCheckCircle className="text-success-500" /> : <IconCircle />}
                      </button>
                      <span className={`text-sm flex-1 ${child.status === 'completed' ? 'line-through text-text-tertiary' : 'text-text-primary'}`}>
                        {child.title}
                      </span>
                      <PriorityBadge priority={child.priority} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end border-t border-border pt-4">
              <Button variant="danger" size="sm" onClick={() => { handleDeleteTask(selectedTask.id); setSelectedTask(null); }}>
                <IconTrash /> Delete
              </Button>
              <Button size="sm" onClick={() => { setEditingTask(selectedTask); setSelectedTask(null); }}>
                <IconEdit /> Edit
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingTask(null)}>
          <Card className="w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-text-primary mb-3">Edit Task</h3>
            <div className="flex flex-col gap-3">
              <Input placeholder="Task title" value={editingTask.title} onChange={e => setEditingTask({ ...editingTask, title: e.target.value })} />
              <textarea
                placeholder="Description"
                value={editingTask.description || ''}
                onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                className="border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[80px] resize-y"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Priority</label>
                  <select value={editingTask.priority} onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-text-tertiary mb-1 block">Due Date</label>
                  <input type="date" value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''} onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value || undefined })} className="w-full border border-border rounded-md px-3 py-2 text-sm bg-surface text-text-primary" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setEditingTask(null)}>Cancel</Button>
                <Button size="sm" onClick={() => { handleUpdateTask(editingTask.id, { title: editingTask.title, description: editingTask.description, priority: editingTask.priority, due_date: editingTask.due_date }); setEditingTask(null); }}>Save</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Task Group (List view)
function TaskGroup({ status, tasks, childTasks, onStatusChange, onPriorityChange, onDelete, onSelect, onEdit }: {
  status: TaskStatus
  tasks: Task[]
  childTasks: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onPriorityChange: (id: string, priority: TaskPriority) => void
  onDelete: (id: string) => void
  onSelect: (task: Task) => void
  onEdit: (task: Task) => void
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(!expanded)} className="text-text-tertiary hover:text-text-secondary transition-colors">
            <IconChevronDown className={expanded ? '' : 'rotate-180'} />
          </button>
          <StatusPill status={status} />
          <span className="text-xs text-text-tertiary ml-1">({tasks.length})</span>
        </div>
      </div>

      {expanded && (
        <>
          {tasks.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-text-tertiary font-medium border-b border-border">
                  <th className="text-left py-2 px-4 font-medium w-[35%]">Name</th>
                  <th className="text-left py-2 px-4 font-medium w-[15%]">Due Date</th>
                  <th className="text-left py-2 px-4 font-medium w-[15%]">Priority</th>
                  <th className="text-left py-2 px-4 font-medium w-[15%]">Assignee</th>
                  <th className="text-left py-2 px-4 font-medium w-[10%]">Progress</th>
                  <th className="w-[10%]"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const subtasks = childTasks.filter(ct => ct.parent_id === task.id)
                  const completedSubtasks = subtasks.filter(st => st.status === 'completed').length
                  const progress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : (task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0)

                  return (
                    <tr key={task.id} className="border-t border-border hover:bg-surface-secondary transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => {
                              const next: Record<TaskStatus, TaskStatus> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }
                              onStatusChange(task.id, next[task.status])
                            }}
                            className="text-text-tertiary hover:text-brand-500 transition-colors"
                          >
                            {task.status === 'completed' ? <IconCheckCircle className="text-success-500" /> : task.status === 'in_progress' ? <IconCircleHalf className="text-brand-500" /> : <IconCircle />}
                          </button>
                          <button onClick={() => onSelect(task)} className="text-sm text-left hover:text-brand-500 transition-colors">
                            <span className={task.status === 'completed' ? 'line-through text-text-tertiary' : 'text-text-primary'}>
                              {task.title}
                            </span>
                            {subtasks.length > 0 && (
                              <span className="text-xs text-text-tertiary ml-2">({completedSubtasks}/{subtasks.length})</span>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {task.due_date ? (
                          <span className="text-text-secondary">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={task.priority}
                          onChange={e => onPriorityChange(task.id, e.target.value as TaskPriority)}
                          className="text-xs border border-border rounded px-2 py-1 bg-surface text-text-primary"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        {task.assignee_name ? (
                          <Avatar name={task.assignee_name} size="sm" />
                        ) : (
                          <span className="text-text-tertiary text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-text-tertiary">{progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-surface-tertiary text-text-tertiary hover:text-text-secondary transition-colors">
                          <IconEdit />
                        </button>
                        <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-surface-tertiary text-text-tertiary hover:text-danger-500 transition-colors ml-1">
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="px-4 py-3 text-sm text-text-tertiary">No tasks</div>
          )}
        </>
      )}
    </Card>
  )
}

// Task Card (Board view)
function TaskCard({ task, childTasks, onStatusChange, onPriorityChange, onDelete, onSelect }: {
  task: Task
  childTasks: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onPriorityChange: (id: string, priority: TaskPriority) => void
  onDelete: (id: string) => void
  onSelect: (task: Task) => void
}) {
  return (
    <Card padding="sm" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onSelect(task)}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-text-primary flex-1">{task.title}</h4>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }} className="p-0.5 rounded hover:bg-surface-tertiary text-text-tertiary hover:text-danger-500">
          <IconTrash className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <select
          value={task.priority}
          onClick={e => e.stopPropagation()}
          onChange={e => onPriorityChange(task.id, e.target.value as TaskPriority)}
          className="text-xs border border-border rounded px-1.5 py-0.5 bg-surface text-text-primary"
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        {task.due_date && (
          <span className="text-xs text-text-tertiary">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); const next: Record<TaskStatus, TaskStatus> = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }; onStatusChange(task.id, next[task.status]); }}>
            {task.status === 'completed' ? <IconCheckCircle className="text-success-500 w-4 h-4" /> : task.status === 'in_progress' ? <IconCircleHalf className="text-brand-500 w-4 h-4" /> : <IconCircle className="w-4 h-4" />}
          </button>
          {childTasks.length > 0 && (
            <span className="text-xs text-text-tertiary">{childTasks.filter(c => c.status === 'completed').length}/{childTasks.length}</span>
          )}
        </div>
        {task.assignee_name && <Avatar name={task.assignee_name} size="sm" />}
      </div>
    </Card>
  )
}

// Icons
function IconChart() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg> }
function IconList() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconBoard() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function IconArrowLeft() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> }
function IconPlus({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconChevronDown({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg> }
function IconCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> }
function IconCircleHalf() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" opacity="0.5"><circle cx="12" cy="12" r="10"/></svg> }
function IconCheckCircle({ className = '' }: { className?: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="white" strokeWidth="2"/></svg> }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconEdit() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function IconTrash() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> }
