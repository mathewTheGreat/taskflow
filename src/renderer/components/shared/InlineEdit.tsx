import { useState, useRef, useEffect } from 'react'

interface InlineEditProps {
  value: string
  onSave: (value: string) => void
  className?: string
  placeholder?: string
}

export function InlineEdit({ value, onSave, className = '', placeholder }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const commit = () => {
    setEditing(false)
    if (draft.trim() && draft !== value) onSave(draft.trim())
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={`inline-edit__input ${className}`}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        placeholder={placeholder}
      />
    )
  }

  return (
    <span className={`inline-edit__text ${className}`} onClick={() => setEditing(true)} title="Click to edit">
      {value || placeholder}
    </span>
  )
}
