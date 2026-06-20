import type { TaskStatus } from '@shared/types'

interface StatusPillProps {
  status: TaskStatus
  className?: string
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-surface-tertiary text-text-secondary',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-warning-50 text-warning-500',
  },
  completed: {
    label: 'Completed',
    className: 'bg-success-50 text-success-500',
  },
}

export function StatusPill({ status, className = '' }: StatusPillProps) {
  const config = statusConfig[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className} ${className}`}>
      {status === 'completed' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {config.label}
    </span>
  )
}
