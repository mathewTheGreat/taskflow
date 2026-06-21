interface DateInputProps {
  value?: string
  onChange: (value: string | undefined) => void
  className?: string
}

export function DateInput({ value, onChange, className = '' }: DateInputProps) {
  const today = () => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }

  const tomorrow = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  const nextWeek = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }

  return (
    <div className={`date-input ${className}`}>
      <input
        type="date"
        value={value ? value.split('T')[0] : ''}
        onChange={e => onChange(e.target.value || undefined)}
        className="date-input__picker"
      />
      <div className="date-input__quick">
        <button type="button" className="date-input__btn" onClick={() => onChange(today())}>Today</button>
        <button type="button" className="date-input__btn" onClick={() => onChange(tomorrow())}>Tomorrow</button>
        <button type="button" className="date-input__btn" onClick={() => onChange(nextWeek())}>Next Week</button>
        {value && (
          <button type="button" className="date-input__btn date-input__btn--clear" onClick={() => onChange(undefined)}>Clear</button>
        )}
      </div>
    </div>
  )
}
