import { useState, useEffect, useRef, useCallback } from 'react'

const DEFAULT_WORK  = 25
const DEFAULT_BREAK = 5

function fmt(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// Three-tone ascending chime via Web Audio API (no external file needed)
function playSessionChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const beep = (freq, start, dur) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'; osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + start)
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + dur)
    }
    beep(660,  0,    0.45)
    beep(880,  0.5,  0.45)
    beep(1100, 1.0,  0.6)
    setTimeout(() => ctx.close(), 2500)
  } catch { /* audio not supported */ }
}

function CircularProgress({ timeLeft, total, size = 190, stroke = 5 }) {
  const r    = (size - stroke * 2) / 2
  const cx   = size / 2
  const cy   = size / 2
  const circ = 2 * Math.PI * r
  const pct  = total > 0 ? timeLeft / total : 0
  return (
    <svg className="timer-svg" width={size} height={size}
      viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="timer-track" cx={cx} cy={cy} r={r}
        strokeDasharray={circ} strokeDashoffset="0" />
      <circle className="timer-progress" cx={cx} cy={cy} r={r}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} />
    </svg>
  )
}

function Stepper({ id, label, value, min, max, onChange }) {
  return (
    <div className="stepper" id={id}>
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button className="stepper-btn" disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}>−</button>
        <span className="stepper-value">{value}</span>
        <button className="stepper-btn" disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}>+</button>
      </div>
      <span className="stepper-unit">min</span>
    </div>
  )
}

export default function SensoryTimer({ apiOnline }) {
  const [workMins,  setWorkMins]  = useState(DEFAULT_WORK)
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK)
  const [timeLeft,  setTimeLeft]  = useState(DEFAULT_WORK * 60)
  // total is stored as separate state so it only changes when the session
  // actually switches — prevents the SVG from momentarily jumping
  const [total,     setTotal]     = useState(DEFAULT_WORK * 60)
  const [isWork,    setIsWork]    = useState(true)
  const [isActive,  setIsActive]  = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const intervalRef = useRef(null)

  // ── Refs so tick() never needs to be recreated (kills interval jitter) ─────
  const apiRef      = useRef(apiOnline)
  const isWorkRef   = useRef(true)
  const workRef     = useRef(DEFAULT_WORK)
  const breakRef    = useRef(DEFAULT_BREAK)
  const autoRef     = useRef(false)

  useEffect(() => { apiRef.current   = apiOnline  }, [apiOnline])
  useEffect(() => { isWorkRef.current = isWork    }, [isWork])
  useEffect(() => { workRef.current   = workMins  }, [workMins])
  useEffect(() => { breakRef.current  = breakMins }, [breakMins])
  useEffect(() => { autoRef.current   = autoStart }, [autoStart])

  // ── Sync from backend on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!apiOnline) return
    fetch('/api/focus/timer')
      .then(r => r.ok ? r.json() : null)
      .then(snap => {
        if (!snap) return
        const wm = snap.workMinutes  || DEFAULT_WORK
        const bm = snap.breakMinutes || DEFAULT_BREAK
        setWorkMins(wm); setBreakMins(bm)
        setIsWork(snap.isWorkSession)
        const t = snap.isWorkSession ? wm * 60 : bm * 60
        setTotal(t)
        setTimeLeft(snap.secondsRemaining)
        setIsActive(snap.isActive)
      }).catch(() => {})
  }, [apiOnline])

  // ── Stable tick — empty deps, reads everything through refs ───────────────
  const tick = useCallback(async () => {
    if (apiRef.current) {
      try {
        const res = await fetch('/api/focus/timer/tick', { method: 'POST' })
        if (res.ok) {
          const snap = await res.json()
          const wm = snap.workMinutes  || workRef.current
          const bm = snap.breakMinutes || breakRef.current
          // Detect session switch → play chime + update badge + update total
          if (snap.isWorkSession !== isWorkRef.current) {
            playSessionChime()
            setIsWork(snap.isWorkSession)
            setTotal(snap.isWorkSession ? wm * 60 : bm * 60)
          }
          setWorkMins(wm); setBreakMins(bm)
          setTimeLeft(snap.secondsRemaining)
          if (!snap.isActive) setIsActive(false)
          return
        }
      } catch { /* fallthrough to offline */ }
    }
    // Offline fallback
    setTimeLeft(prev => {
      if (prev <= 1) {
        const nextIsWork  = !isWorkRef.current
        const nextTotal   = nextIsWork ? workRef.current * 60 : breakRef.current * 60
        playSessionChime()
        setIsWork(nextIsWork)
        setTotal(nextTotal)
        setIsActive(autoRef.current)
        return nextTotal
      }
      return prev - 1
    })
  }, []) // ← intentionally empty: tick is stable for the component lifetime

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(tick, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, tick])

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleToggle = async () => {
    const next = !isActive
    if (apiRef.current) {
      try { await fetch(`/api/focus/timer/${next ? 'start' : 'pause'}`, { method: 'POST' }) }
      catch { /* ignore */ }
    }
    setIsActive(next)
  }

  const handleReset = async () => {
    setIsActive(false)
    if (apiRef.current) {
      try {
        const res = await fetch('/api/focus/timer/reset', { method: 'POST' })
        if (res.ok) {
          const snap = await res.json()
          const wm = snap.workMinutes || DEFAULT_WORK
          const bm = snap.breakMinutes || DEFAULT_BREAK
          setWorkMins(wm); setBreakMins(bm)
          setIsWork(snap.isWorkSession)
          const t = snap.isWorkSession ? wm * 60 : bm * 60
          setTotal(t); setTimeLeft(snap.secondsRemaining)
          return
        }
      } catch { /* ignore */ }
    }
    setIsWork(true)
    setTotal(workRef.current * 60)
    setTimeLeft(workRef.current * 60)
  }

  const handleSwitch = async () => {
    setIsActive(false)
    if (apiRef.current) {
      try {
        const res = await fetch('/api/focus/timer/switch', { method: 'POST' })
        if (res.ok) {
          const snap = await res.json()
          setIsWork(snap.isWorkSession)
          const t = snap.isWorkSession ? snap.workMinutes * 60 : snap.breakMinutes * 60
          setTotal(t); setTimeLeft(snap.secondsRemaining)
          return
        }
      } catch { /* ignore */ }
    }
    const next = !isWorkRef.current
    const t    = next ? workRef.current * 60 : breakRef.current * 60
    setIsWork(next); setTotal(t); setTimeLeft(t)
  }

  const applySettings = async (newWork, newBreak) => {
    setWorkMins(newWork); setBreakMins(newBreak)
    if (apiRef.current) {
      try {
        const res = await fetch('/api/focus/timer/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workMinutes: newWork, breakMinutes: newBreak }),
        })
        if (res.ok) {
          const snap = await res.json()
          const t = snap.isWorkSession ? newWork * 60 : newBreak * 60
          setTotal(t); setTimeLeft(snap.secondsRemaining)
          setIsWork(snap.isWorkSession)
          return
        }
      } catch { /* ignore */ }
    }
    const t = isWorkRef.current ? newWork * 60 : newBreak * 60
    setTotal(t); setTimeLeft(t)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="timer-card">

      <div className="session-mode-row" role="group" aria-label="Session type">
        <button id="timer-work-badge"
          className={`session-badge ${isWork ? 'session-badge--active' : ''}`}
          onClick={isWork ? undefined : handleSwitch}
          aria-pressed={isWork} aria-label="Work session">
          Work
        </button>
        <button id="timer-break-badge"
          className={`session-badge ${!isWork ? 'session-badge--active' : ''}`}
          onClick={!isWork ? undefined : handleSwitch}
          aria-pressed={!isWork} aria-label="Break session">
          Break
        </button>
      </div>

      <div className="timer-ring-area">
        <div className="timer-circle-wrap" role="timer" aria-live="polite"
          aria-label={`${isWork ? 'Work' : 'Break'} – ${fmt(timeLeft)} remaining`}>
          <div className="timer-circle-bg">
            <span className="timer-time">{fmt(timeLeft)}</span>
          </div>
          <CircularProgress timeLeft={timeLeft} total={total} />
        </div>
      </div>

      <div className="timer-footer">
        <div className="timer-controls-row">
          <button id="timer-start-btn" className="pill-btn timer-start-btn"
            onClick={handleToggle}
            aria-label={isActive ? 'Pause timer' : 'Start timer'}>
            {isActive ? '⏸  Pause' : '▷  Start'}
          </button>
          <button id="timer-reset-btn" className="reset-btn"
            onClick={handleReset} aria-label="Reset timer" title="Reset">↺</button>
        </div>

        <div className="auto-start-row">
          <span className="auto-start-label">Auto-start next</span>
          <label className="toggle" aria-label="Auto-start next session">
            <input id="auto-start-toggle" type="checkbox"
              checked={autoStart} onChange={e => setAutoStart(e.target.checked)} />
            <span className="toggle-track" />
          </label>
        </div>

        <div className="duration-steppers">
          <Stepper id="stepper-work"  label="Work"  value={workMins}
            min={1} max={120} onChange={v => applySettings(v, breakMins)} />
          <div className="stepper-divider" aria-hidden="true" />
          <Stepper id="stepper-break" label="Break" value={breakMins}
            min={1} max={60}  onChange={v => applySettings(workMins, v)} />
        </div>
      </div>
    </div>
  )
}
