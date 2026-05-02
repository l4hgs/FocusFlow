import { useState, useCallback } from 'react'

export default function TaskManager({ apiOnline }) {
  const [tasks, setTasks] = useState([
    { id: crypto.randomUUID(), text: 'Analyze spectrophotometer data', done: true },
    { id: crypto.randomUUID(), text: 'Draft Methods section',          done: false },
    { id: crypto.randomUUID(), text: 'Format citations (APA)',         done: false },
  ])
  const [input, setInput] = useState('')

  const add = useCallback(async () => {
    const t = input.trim()
    if (!t) return
    const newTask = { id: crypto.randomUUID(), text: t, done: false }

    if (apiOnline) {
      try {
        const res = await fetch('/api/focus/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: t, priorityLevel: 1 }),
        })
        if (res.ok) {
          const saved = await res.json()
          setTasks(prev => [...prev, { id: saved.id, text: saved.description, done: false }])
          setInput('')
          return
        }
      } catch { /* fallthrough */ }
    }
    setTasks(prev => [...prev, newTask])
    setInput('')
  }, [input, apiOnline])

  const toggle = useCallback(async (id) => {
    if (apiOnline) {
      try { await fetch(`/api/focus/tasks/${id}/toggle`, { method: 'PATCH' }) }
      catch { /* ignore */ }
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }, [apiOnline])

  const remove = useCallback(async (id) => {
    if (apiOnline) {
      try { await fetch(`/api/focus/tasks/${id}`, { method: 'DELETE' }) }
      catch { /* ignore */ }
    }
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [apiOnline])

  const doneCount = tasks.filter(t => t.done).length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  return (
    <>
      {/* Header */}
      <div className="task-card-header">
        <div className="task-add-row">
          <div>
            <p className="task-card-title">Biology Lab Report</p>
            <p className="task-card-subtitle">Task Decomposition</p>
          </div>
          <button
            id="task-add-open-btn"
            className="icon-btn"
            onClick={add}
            aria-label="Add task"
            title="Add task"
            style={{ fontSize: '1.2rem', fontWeight: 300 }}
          >
            +
          </button>
        </div>

        {/* Inline add form */}
        <div className="add-task-form">
          <input
            id="task-input"
            className="neu-input"
            type="text"
            placeholder="New task…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            aria-label="New task description"
          />
        </div>
      </div>

      {/* Task pills */}
      <div className="task-list" role="list" aria-label="Task list">
        {tasks.length === 0 && (
          <p className="empty-msg">No tasks yet — add one above.</p>
        )}
        {tasks.map(task => (
          <div
            key={task.id}
            className="task-pill"
            role="listitem"
            onClick={() => toggle(task.id)}
            aria-label={`${task.done ? 'Completed' : 'Pending'}: ${task.text}`}
          >
            <div className={`task-dot ${task.done ? 'done' : ''}`} aria-hidden="true">
              {task.done && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className={`task-text ${task.done ? 'done' : ''}`}>{task.text}</span>
            <button
              id={`task-del-${task.id}`}
              className="task-delete-btn"
              onClick={e => { e.stopPropagation(); remove(task.id) }}
              aria-label={`Delete: ${task.text}`}
              title="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Decomposition progress */}
      {tasks.length > 0 && (
        <div className="decomp-progress-section">
          <div className="decomp-progress-label">
            <span>Decomposition Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
    </>
  )
}
