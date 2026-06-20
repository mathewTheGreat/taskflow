import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
}

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button className={`btn btn--${variant} ${size === 'sm' ? 'btn--sm' : ''} ${className}`} {...props}>
      {children}
    </button>
  )
}