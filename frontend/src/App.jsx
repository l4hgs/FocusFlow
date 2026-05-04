import { useState, useEffect } from 'react'
import './App.css'
import SensoryTimer   from './components/SensoryTimer'
import AdaptiveReader from './components/AdaptiveReader'
import TaskDecomposer from './components/TaskDecomposer'

// ── SVG icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Grid: () => (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="11" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="11" width="6" height="6" rx="1.5"/>
      <rect x="11" y="11" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  Sun: () => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8.5" cy="8.5" r="3"/>
      <path d="M8.5 1v1.5M8.5 14v1.5M1 8.5h1.5M14 8.5h1.5M3.4 3.4l1.1 1.1M12.5 12.5l1.1 1.1M12.5 3.4l-1.1 1.1M4.5 12.5l-1.1 1.1" strokeLinecap="round"/>
    </svg>
  ),
  Moon: () => (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 10.5A6 6 0 0 1 6.5 3a6 6 0 1 0 7.5 7.5z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),

}

// ── API health hook ────────────────────────────────────────────────────────────
function useApiOnline() {
  const [online, setOnline] = useState(false)
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/focus/timer', { signal: AbortSignal.timeout(1500) })
        setOnline(res.ok)
      } catch { setOnline(false) }
    }
    check()
    const id = setInterval(check, 10000)
    return () => clearInterval(id)
  }, [])
  return online
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false)
  const apiOnline = useApiOnline()

  // Apply dark class to root element for CSS variable switching
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <div className="shell">

      {/* ── Left Sidebar ───────────────────────────────────────────────── */}
      <aside className="sidebar" aria-label="Sidebar navigation">

        {/* Loop logo */}
        <div className="sidebar-avatar" aria-label="FocusFlow logo">
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 7c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6H2"/>
            <path d="M6 11L2 7l4-4"/>
          </svg>
        </div>

        {/* Dashboard – single nav item */}
        <button
          id="sidebar-dashboard"
          className="icon-btn active"
          aria-label="Dashboard"
          title="Dashboard"
        >
          <Icon.Grid />
        </button>

        <div className="sidebar-spacer" />

        {/* Dark / Light mode toggle */}
        <button
          id="sidebar-theme-toggle"
          className={`icon-btn ${darkMode ? 'active' : ''}`}
          onClick={() => setDarkMode(v => !v)}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          {darkMode ? <Icon.Sun /> : <Icon.Moon />}
        </button>

      </aside>

      {/* ── Main Column ─────────────────────────────────────────────────── */}
      <div className="main-col">
        <main className="content" id="main-content" aria-label="Main content">

          {/* ── Left: Timer Card ──────────────────────────────────────── */}
          <section className="card timer-card fade-up" aria-label="Pomodoro Timer">
            <div className="card-header">
              <h1 className="card-title">Deep Focus</h1>
            </div>
            <SensoryTimer apiOnline={apiOnline} />
          </section>

          {/* ── Right: Stacked Cards ──────────────────────────────────── */}
          <div className="right-col">

            <section className="card fade-up" style={{ animationDelay: '0.05s' }} aria-label="Bionic Reader">
              <AdaptiveReader apiOnline={apiOnline} />
            </section>

            <section className="card fade-up" style={{ animationDelay: '0.1s' }} aria-label="Task Decomposition">
              <TaskDecomposer apiOnline={apiOnline} />
            </section>

          </div>
        </main>
      </div>

    </div>
  )
}
