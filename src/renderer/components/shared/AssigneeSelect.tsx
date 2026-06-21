import { useState, useRef, useEffect } from 'react'
import { Avatar } from './Avatar'

interface UserOption {
  id: string
  name: string
  email?: string
}

interface AssigneeSelectProps {
  value?: string
  assigneeName?: string
  onChange: (userId: string | undefined) => void
  options: UserOption[]
  size?: 'sm' | 'md'
}

export function AssigneeSelect({ value, assigneeName, onChange, options, size = 'sm' }: AssigneeSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = options.find(o => o.id === value)

  return (
    <div className={`assignee-select assignee-select--${size}`} ref={ref}>
      <button
        type="button"
        className="assignee-select__trigger"
        onClick={e => { e.stopPropagation(); setOpen(!open) }}
      >
        {selected ? (
          <Avatar name={selected.name} size={size} />
        ) : (
          <span className="assignee-select__unassigned">
            <IconUser /> Assign
          </span>
        )}
      </button>
      {open && (
        <div className="assignee-select__dropdown">
          {!value && (
            <button
              type="button"
              className="assignee-select__option assignee-select__option--active"
              onClick={() => { onChange(undefined); setOpen(false) }}
            >
              <IconUser /> Unassigned
            </button>
          )}
          {options.map(o => (
            <button
              key={o.id}
              type="button"
              className={`assignee-select__option ${value === o.id ? 'assignee-select__option--selected' : ''}`}
              onClick={() => { onChange(o.id); setOpen(false) }}
            >
              <Avatar name={o.name} size="sm" />
              <span className="assignee-select__option-name">{o.name}</span>
            </button>
          ))}
          {options.length === 0 && (
            <span className="assignee-select__empty">No members</span>
          )}
        </div>
      )}
    </div>
  )
}

function IconUser() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
