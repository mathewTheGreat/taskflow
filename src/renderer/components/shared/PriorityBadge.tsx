import type { TaskPriority } from '@shared/types'

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

const priorityConfig: Record<TaskPriority, { label: string; variant: string }> = {
  low: { label: 'Low', variant: 'priority-badge--low' },
  medium: { label: 'Normal', variant: 'priority-badge--medium' },
  high: { label: 'High', variant: 'priority-badge--high' },
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span className={`priority-badge ${config.variant} ${className}`}>
      <svg className="priority-badge__icon" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
      </svg>
      {config.label} Priority
    </span>
  )
}

export function PriorityDot({ priority, className = '' }: PriorityBadgeProps) {
  const colors: Record<TaskPriority, string> = {
    low: 'priority-dot--low',
    medium: 'priority-dot--medium',
    high: 'priority-dot--high',
  }
  return <span className={`priority-dot ${colors[priority]} ${className}`} />
}
