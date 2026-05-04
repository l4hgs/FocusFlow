import { useState, useCallback, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ── Audio blip (800 Hz, 80 ms) – Flow-State sensory feedback ─────────────────
function playCompletionBlip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
    osc.onended = () => ctx.close()
  } catch (_) { /* audio blocked */ }
}

// ── Seed palette for new subjects ─────────────────────────────────────────────
const SUBJECT_COLORS = ['#5E9E7E', '#6C8EBF', '#9B7DB5', '#BF8A5E', '#BF5E6C', '#5E8FBF']
const SUBJECT_ICONS  = ['🔬', '∫', '📖', '⚗️', '📐', '🌍', '🎭', '💡']

// ── Framer Motion variants ─────────────────────────────────────────────────────
const taskVariants = {
  initial : { opacity: 0, y: -8, scale: 0.97 },
  animate : { opacity: 1, y:  0, scale: 1,    transition: { duration: 0.22, ease: 'easeOut' } },
  exit    : { opacity: 0, x: 30, scale: 0.95, transition: { duration: 0.28, ease: 'easeIn'  } },
}

const doneVariants = {
  initial : { opacity: 0, x: -12 },
  animate : { opacity: 1, x:   0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit    : { opacity: 0, x:  12, transition: { duration: 0.18 } },
}

// ── Normalise API task → local shape ─────────────────────────────────────────
function normalise(t) {
  return {
    id         : t.id,
    text       : t.description,
    status     : t.status,   // 0=Active  1=Done  4=Deleted
    priority   : t.priorityLevel ?? 1,
    completedAt: t.completedAt ?? null,
  }
}

// ── Single animated task row ──────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete, variants }) {
  const isDone = task.status === 1
  return (
    <motion.div
      layout
      key={task.id}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`task-pill ${isDone ? 'task-pill--done' : ''}`}
      role="listitem"
      onClick={() => onToggle(task.id)}
      aria-label={`${isDone ? 'Completed' : 'Pending'}: ${task.text}`}
    >
      {/* Checkbox dot */}
      <div className={`task-dot ${isDone ? 'done' : ''}`} aria-hidden="true">
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="var(--bg)" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Label */}
      <span className={`task-text ${isDone ? 'done' : ''}`}>{task.text}</span>

      {/* Delete button – visible on hover */}
      <div className="task-actions" onClick={e => e.stopPropagation()}>
        <button
          id={`task-del-${task.id}`}
          className="task-delete-btn"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete: ${task.text}`}
          title="Delete task"
        >×</button>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TaskDecomposer({ apiOnline }) {
  const [subjects, setSubjects]               = useState([])
  const [activeSubjectId, setActiveSubjectId] = useState(null)
  const [taskInput, setTaskInput]             = useState('')
  const [subjectInput, setSubjectInput]       = useState('')
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [showDone, setShowDone]               = useState(false)
  const [loading, setLoading]                 = useState(false)
  const taskInputRef = useRef(null)

  // ── Load subjects from API ────────────────────────────────────────────────
  const fetchSubjects = useCallback(async () => {
    if (!apiOnline) return
    try {
      const res = await fetch('/api/focus/subjects')
      if (res.ok) {
        const data = await res.json()
        setSubjects(data)
        if (!activeSubjectId && data.length > 0) setActiveSubjectId(data[0].id)
      }
    } catch { /* offline fallback */ }
  }, [apiOnline, activeSubjectId])

  useEffect(() => { fetchSubjects() }, [apiOnline])

  // ── Active subject (computed) ─────────────────────────────────────────────
  const subject     = subjects.find(s => s.id === activeSubjectId) ?? null
  const rawTasks    = subject?.tasks ?? []
  const activeTasks = rawTasks.filter(t => t.status === 0).map(normalise)
  const doneTasks   = rawTasks.filter(t => t.status === 1).map(normalise)
  const total       = rawTasks.filter(t => t.status !== 4).length
  const doneCount   = doneTasks.length
  const pct         = total ? Math.round((doneCount / total) * 100) : 0

  // ── Add Subject ───────────────────────────────────────────────────────────
  const addSubject = useCallback(async () => {
    const name = subjectInput.trim()
    if (!name) return
    const colorIdx = subjects.length % SUBJECT_COLORS.length
    const iconIdx  = subjects.length % SUBJECT_ICONS.length
    const payload  = {
      name,
      icon : SUBJECT_ICONS[iconIdx],
      color: SUBJECT_COLORS[colorIdx],
    }
    if (apiOnline) {
      try {
        const res = await fetch('/api/focus/subjects', {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify(payload),
        })
        if (res.ok) {
          const newSubject = await res.json()
          setSubjects(prev => [...prev, newSubject])
          setActiveSubjectId(newSubject.id)
          setSubjectInput('')
          setShowSubjectForm(false)
          return
        }
      } catch { /* fallthrough */ }
    }
    // Offline stub
    const stub = { id: crypto.randomUUID(), tasks: [], progressPercent: 0, ...payload }
    setSubjects(prev => [...prev, stub])
    setActiveSubjectId(stub.id)
    setSubjectInput('')
    setShowSubjectForm(false)
  }, [subjectInput, subjects.length, apiOnline])

  // ── Delete Subject ────────────────────────────────────────────────────────
  const deleteSubject = useCallback(async (subjectId) => {
    // Switch to another subject before removing
    const remaining = subjects.filter(s => s.id !== subjectId)
    setActiveSubjectId(remaining.length > 0 ? remaining[0].id : null)
    setSubjects(remaining)

    if (apiOnline) {
      try {
        await fetch(`/api/focus/subjects/${subjectId}`, { method: 'DELETE' })
      } catch { /* ignore */ }
    }
  }, [subjects, apiOnline])

  // ── Add Task ──────────────────────────────────────────────────────────────
  const addTask = useCallback(async () => {
    const desc = taskInput.trim()
    if (!desc || !activeSubjectId) return
    setLoading(true)

    const optimisticTask = {
      id: crypto.randomUUID(), description: desc,
      status: 0, priorityLevel: 1, completedAt: null,
    }

    if (apiOnline) {
      try {
        const res = await fetch(`/api/focus/subjects/${activeSubjectId}/tasks`, {
          method : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body   : JSON.stringify({ description: desc, priorityLevel: 1 }),
        })
        if (res.ok) {
          const updated = await res.json()
          setSubjects(prev => prev.map(s => s.id === activeSubjectId ? updated : s))
          setTaskInput('')
          setLoading(false)
          return
        }
      } catch { /* fallthrough */ }
    }
    // Offline optimistic update
    setSubjects(prev => prev.map(s =>
      s.id === activeSubjectId
        ? { ...s, tasks: [...(s.tasks ?? []), optimisticTask] }
        : s
    ))
    setTaskInput('')
    setLoading(false)
  }, [taskInput, activeSubjectId, apiOnline])

  // ── Toggle Task (completion) ──────────────────────────────────────────────
  const toggleTask = useCallback(async (taskId) => {
    if (!activeSubjectId) return

    const currentTask  = rawTasks.find(t => t.id === taskId)
    const willComplete = currentTask?.status !== 1

    if (willComplete) playCompletionBlip()

    // Optimistic update
    setSubjects(prev => prev.map(s => {
      if (s.id !== activeSubjectId) return s
      return {
        ...s,
        tasks: s.tasks.map(t => t.id !== taskId ? t : {
          ...t,
          status     : willComplete ? 1 : 0,
          completedAt: willComplete ? new Date().toISOString() : null,
        }),
      }
    }))

    if (apiOnline) {
      try {
        const res = await fetch(
          `/api/focus/subjects/${activeSubjectId}/tasks/${taskId}/toggle`,
          { method: 'PATCH' }
        )
        if (res.ok) {
          const updated = await res.json()
          setSubjects(prev => prev.map(s => s.id === activeSubjectId ? updated : s))
        }
      } catch { /* keep optimistic state */ }
    }
  }, [activeSubjectId, rawTasks, apiOnline])

  // ── Delete Task ───────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (taskId) => {
    if (!activeSubjectId) return
    setSubjects(prev => prev.map(s =>
      s.id === activeSubjectId
        ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) }
        : s
    ))
    if (apiOnline) {
      try {
        await fetch(`/api/focus/subjects/${activeSubjectId}/tasks/${taskId}`, { method: 'DELETE' })
      } catch { /* ignore */ }
    }
  }, [activeSubjectId, apiOnline])

  // ── Offline stub subjects (shown before API loads) ────────────────────────
  useEffect(() => {
    if (!apiOnline && subjects.length === 0) {
      const bio = {
        id: 'bio-stub', name: 'Biology Lab Report', icon: '🔬', color: '#5E9E7E',
        progressPercent: 33,
        tasks: [
          { id: 't1', description: 'Analyze spectrophotometer data', status: 1, priorityLevel: 2, completedAt: new Date().toISOString() },
          { id: 't2', description: 'Draft Methods section',          status: 0, priorityLevel: 1, completedAt: null },
          { id: 't3', description: 'Format citations (APA)',         status: 0, priorityLevel: 1, completedAt: null },
        ],
      }
      const calc = {
        id: 'calc-stub', name: 'Calculus II', icon: '∫', color: '#6C8EBF',
        progressPercent: 0,
        tasks: [
          { id: 't4', description: 'Practice integration by parts', status: 0, priorityLevel: 3, completedAt: null },
          { id: 't5', description: 'Review Taylor series notes',    status: 0, priorityLevel: 2, completedAt: null },
        ],
      }
      setSubjects([bio, calc])
      setActiveSubjectId('bio-stub')
    }
  }, [apiOnline])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="td-root">

      {/* ── Subject Tab Bar ──────────────────────────────────────────── */}
      <div className="td-subject-bar" role="tablist" aria-label="Subjects">
        {subjects.map(s => (
          <button
            key={s.id}
            id={`subject-tab-${s.id}`}
            role="tab"
            aria-selected={s.id === activeSubjectId}
            className={`td-subject-tab ${s.id === activeSubjectId ? 'active' : ''}`}
            style={{ '--subject-color': s.color }}
            onClick={() => setActiveSubjectId(s.id)}
            title={s.name}
          >
            <span className="td-subject-icon">{s.icon}</span>
            <span className="td-subject-name">{s.name}</span>
          </button>
        ))}

        {/* + New Subject */}
        <button
          id="td-add-subject-btn"
          className="td-subject-tab td-subject-tab--add"
          onClick={() => setShowSubjectForm(v => !v)}
          aria-label="Add subject"
          title="Add new subject"
        >+</button>
      </div>

      {/* ── New Subject Form ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSubjectForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit   ={{ opacity: 0, height: 0 }}
            className="td-subject-form"
          >
            <input
              id="td-subject-input"
              className="neu-input"
              type="text"
              placeholder="Subject name…"
              value={subjectInput}
              onChange={e => setSubjectInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSubject()}
              autoFocus
            />
            <button id="td-subject-confirm" className="neu-btn" onClick={addSubject}>Add</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Card Header ─────────────────────────────────────────────── */}
      {subject ? (
        <>
          <div className="td-card-header">
            <div className="td-card-title-group">
              <span className="td-card-icon" style={{ color: subject.color }}>
                {subject.icon}
              </span>
              <div>
                <p className="task-card-title">{subject.name}</p>
                <p className="task-card-subtitle">Task Decomposition</p>
              </div>
            </div>
            <div className="td-header-actions">
              {/* Show/hide Done list */}
              <button
                id="td-toggle-done-btn"
                className={`td-toggle-done ${showDone ? 'active' : ''}`}
                onClick={() => setShowDone(v => !v)}
                title={showDone ? 'Hide completed' : 'Show completed'}
                aria-pressed={showDone}
              >
                ✓ {doneCount}
              </button>
              {/* Delete Subject */}
              <button
                id={`td-delete-subject-${subject.id}`}
                className="td-delete-subject-btn"
                onClick={() => deleteSubject(subject.id)}
                aria-label={`Delete subject: ${subject.name}`}
                title="Delete this subject"
              >
                🗑
              </button>
            </div>
          </div>

          {/* ── New Task Input Well ──────────────────────────────────── */}
          <div className="td-input-well">
            <input
              ref={taskInputRef}
              id="td-task-input"
              className="neu-input td-task-input"
              type="text"
              placeholder="New task…"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              disabled={loading}
              aria-label="New task description"
            />
            <button
              id="td-task-add-btn"
              className="neu-btn td-add-btn"
              onClick={addTask}
              disabled={loading || !taskInput.trim()}
              aria-label="Add task"
            >+</button>
          </div>

          {/* ── Active Task List ─────────────────────────────────────── */}
          <div className="task-list" role="list" aria-label="Active tasks">
            {activeTasks.length === 0 && (
              <p className="empty-msg">All done! Add a task above.</p>
            )}
            <AnimatePresence mode="popLayout">
              {activeTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  variants={taskVariants}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* ── Done List (collapsible) ──────────────────────────────── */}
          <AnimatePresence>
            {showDone && doneTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transition: { duration: 0.25 } }}
                exit   ={{ opacity: 0, height: 0,      transition: { duration: 0.2  } }}
                className="td-done-section"
              >
                <p className="td-done-label">Completed</p>
                <div className="task-list" role="list" aria-label="Completed tasks">
                  <AnimatePresence mode="popLayout">
                    {doneTasks.map(task => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        variants={doneVariants}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Decomposition Progress ───────────────────────────────── */}
          {total > 0 && (
            <div className="decomp-progress-section">
              <div className="decomp-progress-label">
                <span>Decomposition Progress</span>
                <span style={{ color: subject.color, fontWeight: 700 }}>{pct}%</span>
              </div>
              <div className="progress-wrap">
                <motion.div
                  className="progress-fill"
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{ background: subject.color }}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="empty-msg">Create a Subject above to get started.</p>
      )}
    </div>
  )
}
