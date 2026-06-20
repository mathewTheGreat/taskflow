import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const paddingMap = {
  none: 'card-padding--none',
  sm: 'card-padding--sm',
  md: 'card-padding--md',
  lg: 'card-padding--lg',
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  return (
    <div className={`card ${paddingMap[padding]} ${className}`}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="card-header">
      <div>
        <h3 className="card-title">{title}</h3>
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
