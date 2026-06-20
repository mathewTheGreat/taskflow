import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand'
  size?: 'sm' | 'md'
}

const variantClass: Record<string, string> = {
  default: 'badge--default',
  success: 'badge--success',
  warning: 'badge--warning',
  danger: 'badge--danger',
  info: 'badge--info',
  brand: 'badge--brand',
}

const sizeClass = {
  sm: 'badge--sm',
  md: 'badge--md',
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span className={`badge ${variantClass[variant]} ${sizeClass[size]}`}>
      {children}
    </span>
  )
}