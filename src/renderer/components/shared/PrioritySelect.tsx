import { useState, useRef, useEffect } from 'react'
import type { TaskPriority } from '@shared/types'

interface PrioritySelectProps {
  value: TaskPriority
  onChange: (value: TaskPriority) => void
  size?: 'sm' | 'md'
}

const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const dotClasses: Record<TaskPriority, string> = {
  low: 'priority-select__dot--low',
  medium: 'priority-select__dot--medium',
  high: 'priority-select__dot--high',
}

const dotColors: Record<TaskPriority, string> = {
  low: '#BDBDBD',
  medium: '#185FA5',
  high: '#D8302F',
}

export function PrioritySelect({ value, onChange, size = 'md' }: PrioritySelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const current = priorities.find(p => p.value === value) || priorities[1]

  return (
    <div className={`priority-select priority-select--${size}`} ref={ref}>
      <button
        type="button"
        className="priority-select__trigger"
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`priority-select__dot ${dotClasses[value]}`} style={{ background: dotColors[value] }} />
        <span className="priority-select__label">{current.label}</span>
        <span className="priority-select__chevron">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      {open && (
        <div className="priority-select__dropdown" role="listbox">
          {priorities.map(p => (
            <button
              key={p.value}
              type="button"
              role="option"
              aria-selected={value === p.value}
              className={`priority-select__option ${value === p.value ? 'priority-select__option--selected' : ''}`}
              onClick={e => { e.stopPropagation(); onChange(p.value); setOpen(false) }}
            >
              <span className="priority-select__option-dot" style={{ background: dotColors[p.value] }} />
              <span className="priority-select__option-label">{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
