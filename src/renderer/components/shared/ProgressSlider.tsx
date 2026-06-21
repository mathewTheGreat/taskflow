import { useState, useRef, useCallback } from 'react'

interface ProgressSliderProps {
  value: number
  onChange: (value: number) => void
  size?: 'sm' | 'md'
  readOnly?: boolean
}

const PRESETS = [0, 25, 50, 75, 100]

export function ProgressSlider({ value, onChange, size = 'md', readOnly }: ProgressSliderProps) {
  const [dragging, setDragging] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

  const setFromEvent = useCallback((clientX: number) => {
    const el = barRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    onChange(clamp(pct))
  }, [onChange])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly) return
    setDragging(true)
    setFromEvent(e.clientX)

    const handleMove = (ev: MouseEvent) => setFromEvent(ev.clientX)
    const handleUp = () => {
      setDragging(false)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return
    const step = e.shiftKey ? 10 : 5
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault(); onChange(clamp(value + step))
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault(); onChange(clamp(value - step))
    }
  }

  return (
    <div className={`progress-slider ${size === 'sm' ? 'progress-slider--sm' : ''}`}>
      <div
        ref={barRef}
        className={`progress-slider__bar ${dragging ? 'progress-slider__bar--dragging' : ''} ${readOnly ? 'progress-slider__bar--readonly' : ''}`}
        role="slider"
        tabIndex={readOnly ? -1 : 0}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Completion progress"
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
      >
        <div className="progress-slider__fill" style={{ width: `${value}%` }} />
        {!readOnly && (
          <div className="progress-slider__thumb" style={{ left: `${value}%` }} />
        )}
      </div>
      <span className="progress-slider__label">{value}%</span>
      {!readOnly && (
        <div className="progress-slider__presets">
          {PRESETS.map(p => (
            <button
              key={p}
              className={`progress-slider__preset ${value === p ? 'progress-slider__preset--active' : ''}`}
              onClick={() => onChange(p)}
            >
              {p}%
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
