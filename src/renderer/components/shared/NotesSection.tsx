import { useState } from 'react'
import { api } from '../../lib/api'

interface Comment {
  id: string
  user_id: string
  user_name: string
  message: string
  created_at: string
}

interface NotesSectionProps {
  taskId: string
  comments: Comment[]
  onCommentAdded: (comment: Comment) => void
}

export function NotesSection({ taskId, comments, onCommentAdded }: NotesSectionProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const res = await api(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        body: { message: text.trim() },
      })
      onCommentAdded(res)
      setText('')
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="notes-section">
      <h4 className="notes-section__title">Notes & Comments</h4>
      <div className="notes-section__list">
        {sorted.length === 0 && (
          <p className="notes-section__empty">No comments yet.</p>
        )}
        {sorted.map(c => (
          <div key={c.id} className="notes-section__item">
            <div className="notes-section__item-header">
              <span className="notes-section__author">{c.user_name}</span>
              <span className="notes-section__date">
                {new Date(c.created_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <p className="notes-section__message">{c.message}</p>
          </div>
        ))}
      </div>
      <form className="notes-section__form" onSubmit={handleSubmit}>
        <textarea
          className="notes-section__input"
          placeholder="Write a comment..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={2}
        />
        <button type="submit" className="notes-section__submit" disabled={!text.trim() || sending}>
          {sending ? 'Sending...' : 'Comment'}
        </button>
      </form>
    </div>
  )
}
