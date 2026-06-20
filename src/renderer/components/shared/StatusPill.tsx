import type { TaskStatus } from '@shared/types'

interface StatusPillProps {
  status: TaskStatus
  className?: string
}

const statusConfig: Record<TaskStatus, { label: string; variant: string }> = {
  pending: { label: 'Pending', variant: 'status-pill--pending' },
  in_progress: { label: 'In Progress', variant: 'status-pill--in_progress' },
  completed: { label: 'Completed', variant: 'status-pill--completed' },
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const config = statusConfig[status]
  return (
    <span className={`status-pill ${config.variant} ${className}`}>
      {status === 'completed' && (
        <svg className="status-pill__icon" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {config.label}
    </span>
  )
}
