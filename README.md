<h1 align="center">
  <br>
  ↺ &nbsp;FocusFlow
  <br>
</h1>

<h4 align="center">A distraction-free, Neumorphic productivity suite for deep work — built with ASP.NET Core and React.</h4>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#how-to-run-locally">Run Locally</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#ui-design-system">UI Design</a>
</p>

---

## Description

**FocusFlow** is a minimalist productivity portal that combines a server-synced Pomodoro timer, a bionic speed-reader, and a subject-based task orchestrator into a single, distraction-free interface. The UI is built on a fully custom monochromatic Neumorphic design system with full dark mode support.

---

## Features

### ⏱️ Deep Focus Timer (Pomodoro)
- Circular SVG progress ring synced to a C# backend — eliminates browser tab-throttling drift.
- **Configurable work and break durations** via ± stepper controls (work: 1–120 min, break: 1–60 min).
- **Work / Break session badges** — click to manually switch sessions at any time; badges auto-update when a session ends automatically.
- **Three-tone ascending chime** (Web Audio API, no external file) plays when a session completes.
- Auto-start toggle for continuous Pomodoro flow.
- Stable `setInterval` using React refs — zero jitter during countdown.
- Full offline fallback when backend is unavailable.

### 📖 Adaptive Reader
- Implements a **Bionic Reading** algorithm: bolds the first 40% of each word to anchor visual fixation.
- Reduces subvocalization and increases reading throughput.
- Adjustable font size via a range slider.
- Toggle between processed (bionic) and plain text views.

### 📋 Task Decomposer (Subject Orchestrator)
- Create **Subjects** (e.g., "Calculus II", "Biology") as containers for related tasks.
- Add, complete, and delete individual tasks within each subject.
- **Delete a subject** to remove it and all its tasks at once.
- Live **Decomposition Progress** bar per subject (% of tasks completed).
- Smooth Framer Motion animations for task state transitions.
- Task lifecycle: **Active → Done** (toggle) or **Deleted** (permanent removal).

### 🎨 UI & Design
- **Neumorphic design system** — entirely monochromatic, all depth from light/shadow variables.
- **Dark mode** toggle (sun/moon) in the sidebar; smooth CSS variable transition.
- All shadows are CSS variables — zero hardcoded `rgba` values, so dark mode is pixel-perfect.
- Hidden scrollbars globally (still scrollable) for an edge-to-edge, seamless layout.
- Sidebar shows a loop logo, dashboard icon, and dark mode toggle only — no nav bar clutter.
- Loop SVG logo in sidebar uses `currentColor` — adapts to dark mode automatically.

### 🔌 Offline / Graceful Degradation
- The app runs fully in the browser if the backend is down.
- All timers, tasks, and reader functionality work client-side.
- The frontend polls `GET /api/focus/timer` every 10 seconds and re-syncs automatically when the backend comes back online.

---

## Tech Stack

**Frontend**
- [React 18](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Framer Motion](https://www.framer.com/motion/) — task list animations
- Pure CSS custom design system (Neumorphic, CSS variables, no Tailwind)
- Web Audio API — session chime (no external audio files)

**Backend**
- [ASP.NET Core Web API (.NET 10)](https://dotnet.microsoft.com/apps/aspnet/apis) — C#
- In-memory singleton services (3-Layer Architecture)
- No database dependency (stateless-friendly for easy persistence migration)

---

## How To Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)

### 1. Clone
```bash
git clone https://github.com/l4hgs/FocusFlow.git
cd FocusFlow
```

### 2. Start the Backend
```bash
cd backend
dotnet run
```
> API runs on `http://localhost:5000`. The Vite dev proxy forwards all `/api/*` requests automatically.

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
> UI runs on `http://localhost:5173`.

> **Tip:** If you get a build lock error (`FocusFlow.API.exe` is locked), run:
> ```powershell
> Stop-Process -Name "FocusFlow.API" -Force
> ```

---

## Architecture

FocusFlow enforces a strict **3-Layer Architecture**:

```
Presentation Layer          Business Logic Layer        Data Layer
──────────────────          ────────────────────        ──────────
FocusController.cs    →     TimerEngineService          StudyTool (base)
  /api/focus/timer          SubjectOrchestratorService  SubjectEntity
  /api/focus/subjects       AdaptiveReaderService       TaskEntity
  /api/focus/tasks          TaskManagerService          TaskStatus (enum)

React Frontend        →     (thin client, no BLL)
  SensoryTimer.jsx
  AdaptiveReader.jsx
  TaskDecomposer.jsx
```

**Key design decisions:**
- `TimerEngineService` holds `_workDuration` / `_breakDuration` in seconds. Every `GET /timer` response includes `workMinutes` and `breakMinutes` so the frontend always knows the current config.
- `SubjectOrchestratorService` uses **Aggregation**: a `SubjectEntity` owns a collection of `TaskEntity` objects. Task deletion is permanent; there is no archive/schedule state.
- `TaskStatus` enum: `Active`, `Done`, `Deleted` — simplified lifecycle (archive/schedule removed).
- The React `tick` callback has an **empty dependency array** and reads all mutable values through `useRef` — this keeps `setInterval` stable and prevents countdown jitter.

---

## UI Design System

All design tokens live in `frontend/src/index.css` as CSS custom properties:

| Variable | Purpose |
|---|---|
| `--bg` / `--surface` | Base and card background (same color — depth from shadows only) |
| `--shadow-out` / `--shadow-out-sm` | Raised element shadows |
| `--shadow-in` / `--shadow-in-deep` | Pressed / inset shadows |
| `--shadow-out-hover` | Hover-state raised shadow |
| `--shadow-sidebar` | Sidebar edge shadow |
| `--timer-track` | SVG circular ring track color |
| `--text-primary` / `--text-secondary` / `--text-muted` | Typography hierarchy |

Dark mode is triggered by adding `.dark` to `<html>` — all variables override automatically.

---

> Built with focus. ↺
