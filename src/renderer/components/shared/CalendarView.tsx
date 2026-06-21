import { useState, useMemo, useCallback } from 'react'
import type { Task, TaskStatus, TaskPriority } from '@shared/types'

interface CalendarViewProps {
  tasks: Task[]
  onSelectTask: (task: Task) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onQuickAdd: (date: string) => void
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'var(--color-warning-400)',
  in_progress: 'var(--color-accent-500)',
  completed: 'var(--color-success-500)',
}

const PRIORITY_BORDERS: Record<TaskPriority, string> = {
  low: 'transparent',
  medium: 'var(--color-accent-300)',
  high: 'var(--color-danger-400)',
}

function getMonthGrid(year: number, month: number): (number | null)[][] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDay = first.getDay()
  const daysInMonth = last.getDate()
  const weeks: (number | null)[][] = []
  let week: (number | null)[] = []

  for (let i = 0; i < startDay; i++) week.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d)
    if (week.length === 7) { weeks.push(week); week = [] }
  }
  while (week.length < 7) week.push(null)
  if (week.length) weeks.push(week)
  return weeks
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function CalendarView({ tasks, onSelectTask, onUpdateTask, onQuickAdd }: CalendarViewProps) {
  const today = useMemo(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
  }, [])
  const [viewYear, setViewYear] = useState(today.year)
  const [viewMonth, setViewMonth] = useState(today.month)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const t of tasks) {
      if (!t.due_date) continue
      const key = t.due_date.slice(0, 10)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tasks])

  const goPrev = useCallback(() => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }, [viewMonth])

  const goNext = useCallback(() => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }, [viewMonth])

  const goToday = useCallback(() => {
    setViewYear(today.year); setViewMonth(today.month)
  }, [today])

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(dateKey)
  }

  const handleDragLeave = () => setDragOver(null)

  const handleDrop = (e: React.DragEvent, dateKey: string) => {
    e.preventDefault()
    setDragOver(null)
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) onUpdateTask(taskId, { due_date: dateKey })
  }

  const formatDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const isToday = (day: number) => viewYear === today.year && viewMonth === today.month && day === today.day

  return (
    <div className="calendar-view">
      <div className="calendar-view__nav">
        <button className="calendar-view__nav-btn" onClick={goToday}>Today</button>
        <div className="calendar-view__nav-group">
          <button className="calendar-view__nav-btn" onClick={goPrev}><IconChevronLeft /></button>
          <span className="calendar-view__nav-title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button className="calendar-view__nav-btn" onClick={goNext}><IconChevronRight /></button>
        </div>
      </div>
      <div className="calendar-view__grid">
        {DAY_NAMES.map(d => <div key={d} className="calendar-view__day-name">{d}</div>)}
        {grid.map((week, wi) => week.map((day, di) => {
          if (day === null) return <div key={`${wi}-${di}`} className="calendar-view__cell calendar-view__cell--empty" />
          const dateKey = formatDateKey(viewYear, viewMonth, day)
          const dayTasks = tasksByDate.get(dateKey) || []
          const visible = dayTasks.slice(0, 3)
          const overflow = dayTasks.length - 3
          return (
            <div
              key={`${wi}-${di}`}
              className={`calendar-view__cell ${isToday(day) ? 'calendar-view__cell--today' : ''} ${dragOver === dateKey ? 'calendar-view__cell--drag-over' : ''}`}
              onDragOver={e => handleDragOver(e, dateKey)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, dateKey)}
            >
              <div className="calendar-view__cell-header">
                <span className="calendar-view__cell-day">{day}</span>
                <button
                  className="calendar-view__cell-add"
                  onClick={() => onQuickAdd(dateKey)}
                  title="Add task on this date"
                >
                  <IconPlusSmall />
                </button>
              </div>
              <div className="calendar-view__cell-tasks">
                {visible.map(t => (
                  <div
                    key={t.id}
                    className="calendar-view__task"
                    draggable
                    onDragStart={e => handleDragStart(e, t.id)}
                    onClick={() => onSelectTask(t)}
                    title={t.title}
                    style={{
                      background: STATUS_COLORS[t.status],
                      borderLeft: `3px solid ${PRIORITY_BORDERS[t.priority]}`,
                    }}
                  >
                    <span className="calendar-view__task-text">{t.title}</span>
                  </div>
                ))}
                {overflow > 0 && (
                  <div className="calendar-view__task-more" onClick={e => { e.stopPropagation() }}>
                    +{overflow} more
                  </div>
                )}
              </div>
            </div>
          )
        }))}
      </div>
    </div>
  )
}

function IconChevronLeft() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function IconChevronRight() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg> }
function IconPlusSmall() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> }
