import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: string
}

export function Input({ label, icon, error, className = '', ...props }: InputProps) {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div className={`relative ${icon ? 'input-with-icon' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input
          className={`input-field ${error ? 'input-field--error' : ''} ${className}`}
          {...props}
        />
      </div>
    </div>
  )
}