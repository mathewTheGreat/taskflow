import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useToast } from '../components/shared/Toast'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusPill } from '../components/shared/StatusPill'
import { Avatar } from '../components/shared/Avatar'
import { AssigneeSelect } from '../components/shared/AssigneeSelect'
import { InlineEdit } from '../components/shared/InlineEdit'
import { DateInput } from '../components/shared/DateInput'
import { ConfirmDialog } from '../components/shared/ConfirmDialog'
import { PrioritySelect } from '../components/shared/PrioritySelect'
import { ProgressSlider } from '../components/shared/ProgressSlider'
import { NotesSection } from '../components/shared/NotesSection'
import { CalendarView } from '../components/shared/CalendarView'
import type { Project, Task, TaskStatus, TaskPriority, Comment } from '@shared/types'

interface ProjectDetailPageProps {
  projectId: string
  onBack: () => void
}

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const { accessToken } = useAuth()
  const { addToast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('list')
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [createStatus, setCreateStatus] = useState<TaskStatus>('pending')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskParentId, setNewTaskParentId] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPriority, setFilterPriority] = useState<string>('')
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [filterDueDate, setFilterDueDate] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [taskComments, setTaskComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)

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
      addToast('error', 'Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [accessToken, projectId])

  useEffect(() => {
    if (!selectedTask || !accessToken) { setTaskComments([]); return }
    setCommentsLoading(true)
    api.getComments(accessToken, selectedTask.id)
      .then(res => setTaskComments(res.comments))
      .catch(() => setTaskComments([]))
      .finally(() => setCommentsLoading(false))
  }, [selectedTask?.id, accessToken])

  const resetCreateForm = () => {
    setNewTaskTitle('')
    setNewTaskDesc('')
    setNewTaskPriority('medium')
    setNewTaskDueDate('')
    setNewTaskParentId('')
    setCreateStatus('pending')
    setShowCreateTask(false)
  }

  const handleCreateTask = async () => {
    if (!accessToken || !newTaskTitle.trim()) return
    const clientId = crypto.randomUUID()
    const optimisticTask: Task = {
      id: clientId,
      project_id: projectId,
      title: newTaskTitle,
      description: newTaskDesc || undefined,
      assignee_id: undefined,
      assignee_name: undefined,
      parent_id: newTaskParentId || undefined,
      status: createStatus,
      priority: newTaskPriority,
      due_date: newTaskDueDate || undefined,
      completion_percentage: createStatus === 'completed' ? 100 : 0,
      created_by: '',
      created_at: new Date().toISOString(),
    }
    setTasks(prev => [...prev, optimisticTask])
    resetCreateForm()
    try {
      await api.createTask(accessToken, {
        id: clientId,
        project_id: projectId,
        title: newTaskTitle,
        description: newTaskDesc || undefined,
        priority: newTaskPriority,
        status: createStatus,
        due_date: newTaskDueDate || undefined,
        parent_id: newTaskParentId || undefined,
      })
      addToast('success', 'Task created')
    } catch (err) {
      addToast('error', 'Failed to create task - saved offline')
      loadData()
    }
  }

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!accessToken) return
    const pct = updates.completion_percentage
    if (pct !== undefined && pct > 0 && pct < 100 && updates.status === undefined) {
      updates.status = 'in_progress'
    }
    if (pct === 100 && updates.status === undefined) {
      updates.status = 'completed'
    }
    try {
      await api.updateTask(accessToken, taskId, updates)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
      if (selectedTask?.id === taskId) setSelectedTask(prev => prev ? { ...prev, ...updates } : null)
    } catch (err) {
      addToast('error', 'Failed to update task')
      loadData()
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!accessToken) return
    try {
      await api.deleteTask(accessToken, taskId)
      addToast('success', 'Task deleted')
      setTasks(prev => prev.filter(t => t.id !== taskId))
      if (selectedTask?.id === taskId) setSelectedTask(null)
    } catch (err) {
      addToast('error', 'Failed to delete task')
    }
    setDeleteConfirm(null)
  }

  const handleStatusToggle = async (taskId: string, current: TaskStatus) => {
    await handleUpdateTask(taskId, { status: current === 'completed' ? 'pending' : 'completed' })
  }

  const handleStartTask = async (taskId: string, current: TaskStatus) => {
    const target: TaskStatus = current === 'in_progress' ? 'pending' : 'in_progress'
    await handleUpdateTask(taskId, { status: target })
  }

  const handlePriorityChange = async (taskId: string, priority: TaskPriority) => {
    await handleUpdateTask(taskId, { priority })
  }

  const handleInlineTitleSave = async (taskId: string, title: string) => {
    await handleUpdateTask(taskId, { title })
  }

  const handleCommentAdded = (comment: Comment) => {
    setTaskComments(prev => [...prev, comment])
  }

  const topLevelTasks = tasks.filter(t => !t.parent_id)
  const childTasks = tasks.filter(t => t.parent_id)

  const filteredTasks = topLevelTasks.filter(t => {
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterAssignee === 'assigned' && !t.assignee_id) return false
    if (filterAssignee === 'unassigned' && t.assignee_id) return false
    if (filterDueDate === 'dated' && !t.due_date) return false
    if (filterDueDate === 'undated' && t.due_date) return false
    return true
  })

  const groupedTasks: Record<TaskStatus, Task[]> = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'completed') return false
    return new Date(task.due_date) < new Date()
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

  const hasTasks = topLevelTasks.length > 0 || childTasks.length > 0

  const memberOptions = project?.members?.map(m => ({ id: m.user_id, name: m.user_name })) || []

  const cycleFilter = (setter: (v: string) => void, current: string, values: string[]) => {
    const idx = values.indexOf(current)
    setter(idx === values.length - 1 ? '' : values[idx + 1])
  }

  return (
    <div className="detail-root">
      <Card className="detail-header-card">
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
          <div className="detail-header__actions" />
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
            <FilterPill label="Due Date" value={filterDueDate || 'All'} active={!!filterDueDate} onClick={() => cycleFilter(setFilterDueDate, filterDueDate, ['undated', 'dated'])} />
            <FilterPill label="Assignee" value={filterAssignee || 'All'} active={!!filterAssignee} onClick={() => cycleFilter(setFilterAssignee, filterAssignee, ['assigned', 'unassigned'])} />
            <FilterPill label="Priority" value={filterPriority || 'All'} active={!!filterPriority} onClick={() => cycleFilter(setFilterPriority, filterPriority, ['high', 'medium', 'low'])} />
            <FilterPill label="Status" value={filterStatus || 'All'} active={!!filterStatus} onClick={() => cycleFilter(setFilterStatus, filterStatus, ['pending', 'in_progress', 'completed'])} />
          </div>
          <Button size="sm" onClick={() => { setCreateStatus('pending'); setShowCreateTask(true) }}>
            <IconPlus /> Add New
          </Button>
        </div>
      </Card>

      {showCreateTask && (
        <Card>
          <h3 className="detail-create-task__title">Create New Task</h3>
          <div className="detail-create-body">
            <Input
              placeholder="Task title"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
            />
            <textarea
              className="detail-create-textarea"
              placeholder="Description (optional)"
              value={newTaskDesc}
              onChange={e => setNewTaskDesc(e.target.value)}
              rows={2}
            />
            <div className="detail-create-priority">
              <select
                value={newTaskPriority}
                onChange={e => setNewTaskPriority(e.target.value as TaskPriority)}
                className="detail-task-select"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={newTaskDueDate}
                onChange={e => setNewTaskDueDate(e.target.value)}
                className="detail-task-select"
              />
              {topLevelTasks.length > 0 && (
                <select
                  value={newTaskParentId}
                  onChange={e => setNewTaskParentId(e.target.value)}
                  className="detail-task-select"
                >
                  <option value="">No parent (top-level)</option>
                  {topLevelTasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="create-form__actions">
              <Button variant="ghost" size="sm" onClick={resetCreateForm}>Cancel</Button>
              <Button size="sm" onClick={handleCreateTask} disabled={!newTaskTitle.trim()}>Create</Button>
            </div>
          </div>
        </Card>
      )}

      {!hasTasks && activeTab !== 'overview' && (
        <div className="detail-empty">
          <h3 className="detail-empty__title">Create your first task</h3>
          <p className="detail-empty__desc">Tasks help you break down your project into manageable pieces. Start by adding a task.</p>
          <Button size="sm" onClick={() => { setCreateStatus('pending'); setShowCreateTask(true) }}>
            <IconPlus /> Create Task
          </Button>
        </div>
      )}

      {activeTab === 'list' && hasTasks && (
        <div className="detail-task-groups">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(status => (
            <TaskGroup
              key={status}
              status={status}
              tasks={groupedTasks[status]}
              childTasks={childTasks}
              members={memberOptions}
              isOverdue={isOverdue}
              formatDate={formatDate}
              onStatusToggle={handleStatusToggle}
              onStartTask={handleStartTask}
              onPriorityChange={handlePriorityChange}
              onUpdateTask={handleUpdateTask}
              onDelete={id => setDeleteConfirm(id)}
              onSelect={setSelectedTask}
              onInlineTitleSave={handleInlineTitleSave}
              onAddTask={() => { setCreateStatus(status); setShowCreateTask(true) }}
            />
          ))}
        </div>
      )}

      {activeTab === 'board' && hasTasks && (
        <div className="detail-board-columns">
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(status => (
            <div key={status} className="board-column">
              <div className="board-column__header">
                <StatusPill status={status} />
              </div>
              <div className="board-column__body">
                {groupedTasks[status].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    childTasks={childTasks.filter(ct => ct.parent_id === task.id)}
                    isOverdue={isOverdue}
                    formatDate={formatDate}
                    onStatusToggle={handleStatusToggle}
                    onStartTask={handleStartTask}
                    onPriorityChange={handlePriorityChange}
                    onDelete={id => setDeleteConfirm(id)}
                    onSelect={setSelectedTask}
                  />
                ))}
                {groupedTasks[status].length === 0 && (
                  <p className="board-column__empty">No tasks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'calendar' && (
        <CalendarView
          tasks={tasks}
          onSelectTask={setSelectedTask}
          onUpdateTask={handleUpdateTask}
          onQuickAdd={date => { setCreateStatus('pending'); setNewTaskDueDate(date); setShowCreateTask(true) }}
        />
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

      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal modal--wide" onClick={e => e.stopPropagation()}>
            <div className="modal__header">
              <div className="modal__header-left">
                <InlineEdit
                  value={selectedTask.title}
                  onSave={title => handleUpdateTask(selectedTask.id, { title })}
                  className="modal__title"
                />
                {selectedTask.description !== undefined && (
                  <InlineEdit
                    value={selectedTask.description || ''}
                    onSave={desc => handleUpdateTask(selectedTask.id, { description: desc || undefined })}
                    placeholder="Add description..."
                    className="modal__desc"
                  />
                )}
              </div>
              <button onClick={() => setSelectedTask(null)} className="modal__close"><IconX /></button>
            </div>
            <div className="modal__body">
              <div className="modal__grid">
                <div>
                  <label className="modal__label">Status</label>
                  <div className="modal__status-group">
                    {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map(s => (
                      <button
                        key={s}
                        className={`modal__status-btn ${selectedTask.status === s ? 'modal__status-btn--active' : ''}`}
                        onClick={() => handleUpdateTask(selectedTask.id, { status: s })}
                      >
                        {s === 'pending' ? 'Pending' : s === 'in_progress' ? 'In Progress' : 'Completed'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="modal__label">Priority</label>
                  <PrioritySelect
                    value={selectedTask.priority}
                    onChange={value => handleUpdateTask(selectedTask.id, { priority: value })}
                    size="md"
                  />
                </div>
                <div>
                  <label className="modal__label">Due Date</label>
                  <DateInput
                    value={selectedTask.due_date}
                    onChange={date => handleUpdateTask(selectedTask.id, { due_date: date || undefined })}
                  />
                </div>
                <div>
                  <label className="modal__label">Assignee</label>
                    <AssigneeSelect
                      value={selectedTask.assignee_id}
                      assigneeName={selectedTask.assignee_name}
                      onChange={userId => handleUpdateTask(selectedTask.id, { assignee_id: userId || null })}
                      options={memberOptions}
                      size="md"
                    />
                </div>
              </div>

              <div className="modal__section">
                <label className="modal__label">Progress</label>
                <ProgressSlider
                  value={selectedTask.completion_percentage}
                  onChange={value => handleUpdateTask(selectedTask.id, { completion_percentage: value })}
                />
              </div>

              <div className="modal__desc-full">
                <label className="modal__label">Description</label>
                <textarea
                  className="modal__textarea"
                  value={selectedTask.description || ''}
                  onChange={e => handleUpdateTask(selectedTask.id, { description: e.target.value || undefined })}
                  placeholder="Add a detailed description..."
                  rows={3}
                />
              </div>

              {childTasks.filter(ct => ct.parent_id === selectedTask.id).length > 0 && (
                <div className="modal__subtasks">
                  <h4 className="modal__subtasks-title">Subtasks</h4>
                  {childTasks.filter(ct => ct.parent_id === selectedTask.id).map(child => (
                    <div key={child.id} className="modal__subtask">
                      <button
                        onClick={() => handleStatusToggle(child.id, child.status)}
                        className="task-title__checkbox"
                      >
                        {child.status === 'completed' ? (
                          <IconCheckCircle className="task-title__checkbox--completed" />
                        ) : (
                          <IconCircle />
                        )}
                      </button>
                      <span className={`modal__subtask-title${child.status === 'completed' ? ' modal__subtask-title--completed' : ''}`}>
                        {child.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <NotesSection
                taskId={selectedTask.id}
                comments={taskComments}
                onCommentAdded={handleCommentAdded}
              />
            </div>
            <div className="modal__footer">
              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(selectedTask.id)}>
                <IconTrash /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete task?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDeleteTask(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}

function TaskGroup({ status, tasks, childTasks, members, isOverdue, formatDate, onStatusToggle, onStartTask, onPriorityChange, onUpdateTask, onDelete, onSelect, onInlineTitleSave, onAddTask }: {
  status: TaskStatus; tasks: Task[]; childTasks: Task[]; members: { id: string; name: string }[]
  isOverdue: (t: Task) => boolean; formatDate: (s: string) => string
  onStatusToggle: (id: string, s: TaskStatus) => void
  onStartTask: (id: string, s: TaskStatus) => void
  onPriorityChange: (id: string, p: TaskPriority) => void
  onUpdateTask: (id: string, u: Partial<Task>) => void
  onDelete: (id: string) => void
  onSelect: (t: Task) => void
  onInlineTitleSave: (id: string, title: string) => void
  onAddTask: () => void
}) {
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
          <div className="task-group__body">
            {tasks.length > 0 ? (
              <table className="task-table">
                <thead>
                  <tr className="task-table__header-row">
                    <th className="task-table__header-cell task-table__header-cell--name">Name</th>
                    <th className="task-table__header-cell task-table__header-cell--progress">Progress</th>
                    <th className="task-table__header-cell task-table__header-cell--assignee">Assignee</th>
                    <th className="task-table__header-cell task-table__header-cell--due">Due Date</th>
                    <th className="task-table__header-cell task-table__header-cell--priority">Priority</th>
                    <th className="task-table__header-cell task-table__header-cell--actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      childTasks={childTasks.filter(ct => ct.parent_id === task.id)}
                      members={members}
                      isOverdue={isOverdue}
                      formatDate={formatDate}
                      onStatusToggle={onStatusToggle}
                      onStartTask={onStartTask}
                      onPriorityChange={onPriorityChange}
                      onUpdateTask={onUpdateTask}
                      onDelete={onDelete}
                      onSelect={onSelect}
                      onInlineTitleSave={onInlineTitleSave}
                    />
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="task-group__empty">No tasks</div>
            )}
          </div>
          <div onClick={onAddTask} className="task-group__add">
            <IconPlus /> Add Task
          </div>
        </>
      )}
    </Card>
  )
}

function TaskRow({ task, childTasks, members, isOverdue, formatDate, onStatusToggle, onStartTask, onPriorityChange, onUpdateTask, onDelete, onSelect, onInlineTitleSave }: {
  task: Task; childTasks: Task[]; members: { id: string; name: string }[]
  isOverdue: (t: Task) => boolean; formatDate: (s: string) => string
  onStatusToggle: (id: string, s: TaskStatus) => void
  onStartTask: (id: string, s: TaskStatus) => void
  onPriorityChange: (id: string, p: TaskPriority) => void
  onUpdateTask: (id: string, u: Partial<Task>) => void
  onDelete: (id: string) => void
  onSelect: (t: Task) => void
  onInlineTitleSave: (id: string, title: string) => void
}) {
  const hasChildren = childTasks.length > 0
  return (
    <>
      <tr className={`task-row ${hasChildren ? 'task-row--parent' : ''}`}>
        <td className="task-row__cell">
          <div className="task-title">
            <button onClick={() => onStatusToggle(task.id, task.status)} className="task-title__checkbox">
              {task.status === 'completed' ? (
                <IconCheckCircle className="task-title__checkbox--completed" />
              ) : (
                <IconCircle />
              )}
            </button>
            <InlineEdit
              value={task.title}
              onSave={title => onInlineTitleSave(task.id, title)}
              className="task-title__text"
            />
            {task.status === 'pending' && (
              <button onClick={e => { e.stopPropagation(); onStartTask(task.id, task.status) }} className="task-start-btn">Start</button>
            )}
            {task.status === 'in_progress' && (
              <button onClick={e => { e.stopPropagation(); onStartTask(task.id, task.status) }} className="task-start-btn">Pause</button>
            )}
          </div>
        </td>
        <td className="task-row__cell">
          <div className="task-progress-inline">
            <div className="task-progress-inline__bar">
              <div className="task-progress-inline__fill" style={{ width: `${task.completion_percentage}%` }} />
            </div>
          </div>
        </td>
        <td className="task-row__cell">
          <AssigneeSelect
            value={task.assignee_id}
            assigneeName={task.assignee_name}
            onChange={userId => onUpdateTask(task.id, { assignee_id: userId || null })}
            options={members}
          />
        </td>
        <td className="task-row__cell">
          <span className={task.due_date ? `task-date${isOverdue(task) ? ' task-date--overdue' : ''}` : 'task-date--empty'}>
            {task.due_date ? formatDate(task.due_date) : <><IconNoDate /> Add date</>}
          </span>
        </td>
        <td className="task-row__cell">
          <PrioritySelect value={task.priority} onChange={value => onPriorityChange(task.id, value)} />
        </td>
        <td className="task-row__cell task-actions" onClick={() => onSelect(task)}>⋯</td>
      </tr>
      {childTasks.map(child => (
        <tr key={child.id} className="task-row task-row--child">
          <td className="task-row__cell">
            <div className="task-title task-title--child">
              <button onClick={() => onStatusToggle(child.id, child.status)} className="task-title__checkbox">
                {child.status === 'completed' ? (
                  <IconCheckCircle className="task-title__checkbox--completed" />
                ) : (
                  <IconCircle />
                )}
              </button>
              <span
                className={`task-title__text${child.status === 'completed' ? ' task-title__text--completed' : ''}`}
                onClick={() => onSelect(child)}
              >
                {child.title}
              </span>
            </div>
          </td>
          <td className="task-row__cell">
            <div className="task-progress-inline">
              <div className="task-progress-inline__bar">
                <div className="task-progress-inline__fill" style={{ width: `${child.completion_percentage}%` }} />
              </div>
            </div>
          </td>
          <td className="task-row__cell" />
          <td className="task-row__cell">
            <span className={child.due_date ? `task-date${isOverdue(child) ? ' task-date--overdue' : ''}` : 'task-date--empty'}>
              {child.due_date ? formatDate(child.due_date) : <><IconNoDate /></>}
            </span>
          </td>
          <td className="task-row__cell">
            <PrioritySelect value={child.priority} onChange={value => onPriorityChange(child.id, value)} />
          </td>
          <td className="task-row__cell task-actions" onClick={() => onSelect(child)}>⋯</td>
        </tr>
      ))}
    </>
  )
}

function TaskCard({ task, childTasks, isOverdue, formatDate, onStatusToggle, onStartTask, onPriorityChange, onDelete, onSelect }: {
  task: Task; childTasks: Task[]
  isOverdue: (t: Task) => boolean; formatDate: (s: string) => string
  onStatusToggle: (id: string, s: TaskStatus) => void
  onStartTask: (id: string, s: TaskStatus) => void
  onPriorityChange: (id: string, p: TaskPriority) => void
  onDelete: (id: string) => void
  onSelect: (t: Task) => void
}) {
  const childProgress = childTasks.length
    ? Math.round(childTasks.filter(c => c.status === 'completed').length / childTasks.length * 100)
    : null

  return (
    <Card padding="sm" className="board-card" onClick={() => onSelect(task)}>
      <div className="board-card__header">
        <h4 className="board-card__title">{task.title}</h4>
        <button onClick={e => { e.stopPropagation(); onDelete(task.id); }} className="task-action-btn task-action-btn--danger">
          <IconTrash />
        </button>
      </div>
      <div className="board-card__meta">
        <PrioritySelect value={task.priority} onChange={value => onPriorityChange(task.id, value)} size="sm" />
        {task.due_date && (
          <span className={`task-date${isOverdue(task) ? ' task-date--overdue' : ''}`}>
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
      {task.completion_percentage > 0 && (
        <div className="board-card__progress">
          <div className="board-card__progress-bar">
            <div className="board-card__progress-fill" style={{ width: `${task.completion_percentage}%` }} />
          </div>
          <span className="board-card__progress-label">{task.completion_percentage}%</span>
        </div>
      )}
      <div className="board-card__footer">
        <button onClick={e => { e.stopPropagation(); onStatusToggle(task.id, task.status) }}>
          {task.status === 'completed' ? (
            <IconCheckCircle className="task-title__checkbox--completed" />
          ) : (
            <IconCircle />
          )}
        </button>
        {task.status === 'pending' && (
          <button onClick={e => { e.stopPropagation(); onStartTask(task.id, task.status) }} className="task-start-btn">Start</button>
        )}
        {task.status === 'in_progress' && (
          <button onClick={e => { e.stopPropagation(); onStartTask(task.id, task.status) }} className="task-start-btn">Pause</button>
        )}
        {childTasks.length > 0 && (
          <span className="task-title__subtasks">{childTasks.filter(c => c.status === 'completed').length}/{childTasks.length}</span>
        )}
        {task.assignee_name && <Avatar name={task.assignee_name} size="sm" />}
      </div>
      {childTasks.length > 0 && (
        <div className="board-card__children">
          {childTasks.slice(0, 3).map(child => (
            <div key={child.id} className="board-card__child">
              <span className={`board-card__child-dot ${child.status === 'completed' ? 'board-card__child-dot--done' : ''}`} />
              <span className={`board-card__child-name ${child.status === 'completed' ? 'board-card__child-name--done' : ''}`}>{child.title}</span>
            </div>
          ))}
          {childTasks.length > 3 && (
            <span className="board-card__child-more">+{childTasks.length - 3} more</span>
          )}
        </div>
      )}
    </Card>
  )
}

function FilterPill({ label, value, active, onClick }: { label: string; value: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`filter-pill${active ? ' filter-pill--active' : ''}`}>
      {label} <span className="filter-pill__value">{value}</span>
      <IconChevronDown />
    </button>
  )
}

function IconClock() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconList() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> }
function IconBoard() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function IconCalendar() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> }
function IconNoDate() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg> }
function IconFile() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function IconArrowLeft() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> }
function IconPlus({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function IconChevronDown({ className = '' }: { className?: string }) { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"/></svg> }
function IconDots() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg> }
function IconCircle() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg> }
function IconCheckCircle({ className = '' }: { className?: string }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" fill="none" stroke="white" strokeWidth="2"/></svg> }
function IconX() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }
function IconTrash() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> }
