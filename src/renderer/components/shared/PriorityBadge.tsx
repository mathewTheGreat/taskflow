import type { TaskPriority } from '@shared/types'

interface PriorityBadgeProps {
  priority: TaskPriority
  className?: string
}

const priorityConfig: Record<TaskPriority, { label: string; color: string; iconColor: string }> = {
  low: {
    label: 'Low',
    color: 'text-accent-500',
    iconColor: 'text-accent-500',
  },
  medium: {
    label: 'Normal',
    color: 'text-accent-500',
    iconColor: 'text-accent-500',
  },
  high: {
    label: 'High',
    color: 'text-danger-500',
    iconColor: 'text-danger-500',
  },
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = priorityConfig[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${config.color} ${className}`}>
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
      </svg>
      {config.label} Priority
    </span>
  )
}

export function PriorityDot({ priority, className = '' }: PriorityBadgeProps) {
  const colors: Record<TaskPriority, string> = {
    low: 'bg-neutral-300',
    medium: 'bg-accent-500',
    high: 'bg-danger-500',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[priority]} ${className}`} />
}
