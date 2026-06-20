import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}
      data-error={error ? 'true' : undefined}
    >
      {label && (
        <label className="text-sm font-medium text-text-secondary">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
            {icon}
          </span>
        )}
        <input
          className={`w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${icon ? 'pl-12' : ''} ${error ? 'border-danger-500 focus:ring-danger-500' : ''}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-danger-500">{error}</span>}
    </div>
  )
}
