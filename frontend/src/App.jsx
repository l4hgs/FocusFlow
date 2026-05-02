import { useState, useEffect } from 'react'
import './App.css'
import SensoryTimer   from './components/SensoryTimer'
import AdaptiveReader from './components/AdaptiveReader'
import TaskManager    from './components/TaskManager'

// ── SVG icons (inline, matches reference aesthetic) ──────────────────────────
const Icon = {
  Grid:    () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="11" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="11" width="6" height="6" rx="1.5"/><rect x="11" y="11" width="6" height="6" rx="1.5"/></svg>,
  Book:    () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h10a1 1 0 0 1 1 1v13l-6-3-6 3V3a1 1 0 0 1 1-1z"/></svg>,
  File:    () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 1h7l4 4v12H4V1z"/><path d="M11 1v4h4"/></svg>,
  Chart:   () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="10" width="3" height="7" rx="1"/><rect x="7.5" y="6" width="3" height="11" rx="1"/><rect x="13" y="2" width="3" height="15" rx="1"/></svg>,
  Gear:    () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="9" r="2.5"/><path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.42 1.42M13.36 13.36l1.42 1.42M14.78 3.22l-1.42 1.42M4.64 13.36l-1.42 1.42"/></svg>,
  Plus:    () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 2v12M2 8h12"/></svg>,
  Search:  () => <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7.5" cy="7.5" r="5.5"/><path d="M13 13l2.5 2.5"/></svg>,
  Bell:    () => <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8.5 2a5 5 0 0 1 5 5v3l1.5 2H2L3.5 10V7a5 5 0 0 1 5-5z"/><path d="M7 14a1.5 1.5 0 0 0 3 0"/></svg>,
  Sliders: () => <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 4h11M3 8h11M3 12h11"/><circle cx="6" cy="4" r="1.5" fill="currentColor" stroke="none"/><circle cx="11" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>,
}

// ── API health hook ───────────────────────────────────────────────────────────
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

const NAV_LINKS = ['AETHELGARD', 'FOCUS', 'ARCHIVE']

const SIDEBAR_ICONS = [
  { id: 'grid',  Icon: Icon.Grid,  label: 'Dashboard', active: true  },
  { id: 'book',  Icon: Icon.Book,  label: 'Reader'                    },
  { id: 'file',  Icon: Icon.File,  label: 'Archive'                   },
  { id: 'chart', Icon: Icon.Chart, label: 'Stats'                     },
]

export default function App() {
  const [activeNav, setActiveNav] = useState('FOCUS')
  const [activeIcon, setActiveIcon] = useState('grid')
  const apiOnline = useApiOnline()

  return (
    <div className="shell">
      {/* ── Left Sidebar ─────────────────────────────────────────────── */}
      <aside className="sidebar" aria-label="Sidebar navigation">
        {/* User avatar */}
        <div className="sidebar-avatar" aria-label="User avatar">C</div>

        {/* Nav icons */}
        {SIDEBAR_ICONS.map(({ id, Icon: Ic, label, active }) => (
          <button
            key={id}
            id={`sidebar-${id}`}
            className={`icon-btn ${activeIcon === id ? 'active' : ''}`}
            onClick={() => setActiveIcon(id)}
            aria-label={label}
            title={label}
          >
            <Ic />
          </button>
        ))}

        <div className="sidebar-spacer" />

        {/* Bottom icons */}
        <button id="sidebar-settings" className="icon-btn" aria-label="Settings" title="Settings">
          <Icon.Gear />
        </button>
        <button id="sidebar-new" className="icon-btn" aria-label="New item" title="New" style={{ marginTop: '0.4rem' }}>
          <Icon.Plus />
        </button>
      </aside>

      {/* ── Main Column ────────────────────────────────────────────── */}
      <div className="main-col">

        {/* ── Top Nav ───────────────────────────────────────────────── */}
        <header className="top-nav" role="banner">
          {/* Brand + nav links */}
          <nav aria-label="Top navigation">
            <ul className="nav-links" role="tablist">
              {NAV_LINKS.map(link => (
                <li
                  key={link}
                  id={`nav-${link.toLowerCase()}`}
                  className={`nav-link ${activeNav === link ? 'active' : ''}`}
                  role="tab"
                  aria-selected={activeNav === link}
                  tabIndex={activeNav === link ? 0 : -1}
                  onClick={() => setActiveNav(link)}
                  onKeyDown={e => e.key === 'Enter' && setActiveNav(link)}
                >
                  {link}
                </li>
              ))}
            </ul>
          </nav>

          {/* Right cluster */}
          <div className="nav-end">
            <button id="nav-search" className="icon-btn" aria-label="Search" title="Search">
              <Icon.Search />
            </button>
            <button id="nav-bell" className="icon-btn" aria-label="Notifications" title="Notifications">
              <Icon.Bell />
            </button>
            <button id="nav-flow-state" className="flow-state-btn" aria-label="Enter flow state">
              Flow State
            </button>
            <div className="user-avatar" aria-label="User profile">
              <Icon.Sliders />
            </div>
          </div>
        </header>

        {/* ── Content Grid ──────────────────────────────────────────── */}
        <main className="content" id="main-content" aria-label="Main content">

          {/* ── Left: Timer Card ──────────────────────────────────── */}
          <section
            className="card timer-card fade-up"
            aria-label="Pomodoro Timer"
          >
            <div className="card-header">
              <h1 className="card-title">Deep Focus</h1>
              <button id="timer-settings-btn" className="icon-btn" aria-label="Timer settings" title="Settings" style={{ width: 34, height: 34 }}>
                <Icon.Sliders />
              </button>
            </div>
            <SensoryTimer apiOnline={apiOnline} />
          </section>

          {/* ── Right: Stacked Cards ──────────────────────────────── */}
          <div className="right-col">

            {/* Bionic Reader */}
            <section
              className="card fade-up"
              style={{ animationDelay: '0.05s' }}
              aria-label="Bionic Reader"
            >
              <AdaptiveReader apiOnline={apiOnline} />
            </section>

            {/* Task Decomposition */}
            <section
              className="card fade-up"
              style={{ animationDelay: '0.1s' }}
              aria-label="Task Decomposition"
            >
              <TaskManager apiOnline={apiOnline} />
            </section>

          </div>
        </main>
      </div>
    </div>
  )
}
