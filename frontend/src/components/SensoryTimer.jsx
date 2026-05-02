import { useState, useEffect, useRef, useCallback } from 'react'

const WORK = 1500
const BREAK = 300

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// SVG arc path helper
function CircularProgress({ timeLeft, total, size = 190, stroke = 5 }) {
  const r = (size - stroke * 2) / 2
  const cx = size / 2
  const cy = size / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (timeLeft / total)

  return (
    <svg
      className="timer-svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle className="timer-track" cx={cx} cy={cy} r={r}
        strokeDasharray={circ} strokeDashoffset="0" />
      <circle className="timer-progress" cx={cx} cy={cy} r={r}
        strokeDasharray={circ} strokeDashoffset={circ - offset} />
    </svg>
  )
}

export default function SensoryTimer({ apiOnline }) {
  const [timeLeft, setTimeLeft]       = useState(WORK)
  const [isWork, setIsWork]           = useState(true)
  const [isActive, setIsActive]       = useState(false)
  const [autoStart, setAutoStart]     = useState(false)
  const intervalRef = useRef(null)
  const total = isWork ? WORK : BREAK

  const tick = useCallback(async () => {
    if (apiOnline) {
      try {
        const res = await fetch('/api/focus/timer/tick', { method: 'POST' })
        if (res.ok) {
          const snap = await res.json()
          setTimeLeft(snap.secondsRemaining)
          setIsWork(snap.isWorkSession)
          if (!snap.isActive) { setIsActive(false) }
          return
        }
      } catch { /* fallthrough */ }
    }
    setTimeLeft(prev => {
      if (prev <= 1) {
        setIsWork(w => !w)
        setIsActive(autoStart)
        return isWork ? BREAK : WORK
      }
      return prev - 1
    })
  }, [apiOnline, isWork, autoStart])

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, tick])

  const handleToggle = async () => {
    const next = !isActive
    if (apiOnline) {
      try { await fetch(`/api/focus/timer/${next ? 'start' : 'pause'}`, { method: 'POST' }) }
      catch { /* ignore */ }
    }
    setIsActive(next)
  }

  const handleReset = async () => {
    setIsActive(false)
    if (apiOnline) {
      try {
        const res = await fetch('/api/focus/timer/reset', { method: 'POST' })
        if (res.ok) {
          const snap = await res.json()
          setTimeLeft(snap.secondsRemaining)
          setIsWork(snap.isWorkSession)
          return
        }
      } catch { /* ignore */ }
    }
    setTimeLeft(WORK)
    setIsWork(true)
  }

  return (
    <div className="timer-card">
      {/* Circular timer */}
      <div className="timer-ring-area">
        <div className="timer-circle-wrap" role="timer" aria-live="polite"
          aria-label={`${isWork ? 'Work' : 'Break'} – ${fmt(timeLeft)} remaining`}>
          <div className="timer-circle-bg">
            <span className="timer-time">{fmt(timeLeft)}</span>
          </div>
          <CircularProgress timeLeft={timeLeft} total={total} />
        </div>
      </div>

      {/* Controls */}
      <div className="timer-footer">
        <div className="timer-controls-row">
          <button
            id="timer-start-btn"
            className="pill-btn timer-start-btn"
            onClick={handleToggle}
            aria-label={isActive ? 'Pause timer' : 'Start timer'}
          >
            {isActive ? '⏸  Pause' : '▷  Start'}
          </button>
          <button
            id="timer-reset-btn"
            className="reset-btn"
            onClick={handleReset}
            aria-label="Reset timer"
            title="Reset"
          >
            ↺
          </button>
        </div>

        <div className="auto-start-row">
          <span className="auto-start-label">Auto-start next</span>
          <label className="toggle" aria-label="Auto-start next session">
            <input
              id="auto-start-toggle"
              type="checkbox"
              checked={autoStart}
              onChange={e => setAutoStart(e.target.checked)}
            />
            <span className="toggle-track" />
          </label>
        </div>
      </div>
    </div>
  )
}
