# 🛠️ Team Setup & Contribution Guide

Welcome to the **FocusFlow** team! This guide covers everything you need to get the project running locally, understand the codebase structure, and follow our Git workflow so we can collaborate without stepping on each other's work.

---

## 📦 Prerequisites

Make sure the following are installed before you begin:

| Tool | Version | Link |
|---|---|---|
| Node.js | v18 or higher | https://nodejs.org |
| .NET SDK | v10 | https://dotnet.microsoft.com/download/dotnet/10.0 |
| Git | Latest | https://git-scm.com |

---

## ⚙️ Local Setup (First Time)

### 1. Clone the repository
```bash
git clone https://github.com/l4hgs/FocusFlow.git
cd FocusFlow
```

### 2. Start the Backend (C# API)
Open a terminal in the `backend/` directory:
```bash
cd backend
dotnet run
```
> The API will be available at `http://localhost:5000`.  
> The frontend proxies `/api/*` requests to this address automatically via Vite config.

### 3. Start the Frontend (React + Vite)
Open a **second** terminal in the `frontend/` directory:
```bash
cd frontend
npm install   # only needed on first run or after pulling new changes
npm run dev
```
> The UI will be available at `http://localhost:5173`.

### 4. Verify Everything Works
Open [http://localhost:5173](http://localhost:5173). The timer card should show **Work / Break** session badges and the circular ring should animate. If the backend is running, timer state is synced server-side.

---

## 🗂️ Project Structure

```
FocusFlow/
├── backend/                    # ASP.NET Core Web API
│   ├── Controllers/
│   │   └── FocusController.cs  # All HTTP endpoints (timer, subjects, tasks)
│   ├── Logic/                  # Business Logic Layer (BLL)
│   │   ├── TimerEngineService.cs       # Pomodoro timer with work/break sessions
│   │   ├── SubjectOrchestratorService.cs # Subject & task lifecycle management
│   │   ├── AdaptiveReaderService.cs    # Bionic text processing
│   │   └── TaskManagerService.cs       # Legacy flat task manager
│   ├── Models/                 # Data Layer entities & enums
│   │   ├── SubjectEntity.cs
│   │   ├── TaskEntity.cs
│   │   └── TaskStatus.cs
│   └── Program.cs              # DI registration & middleware
│
└── frontend/                   # React + Vite SPA
    └── src/
        ├── App.jsx             # Root shell: sidebar, layout, dark mode
        ├── App.css             # Component-scoped styles
        ├── index.css           # Global design system (CSS variables, primitives)
        └── components/
            ├── SensoryTimer.jsx    # Pomodoro timer with session controls
            ├── AdaptiveReader.jsx  # Bionic reading tool
            └── TaskDecomposer.jsx  # Subject & task orchestrator
```

---

## 🌿 Git Workflow

### The Golden Rule
> **Never commit directly to `main`.** It must always contain stable, working code.

### Step-by-step

**1. Always start fresh from `main`**
```bash
git checkout main
git pull origin main
```

**2. Create a feature/fix branch**

Use a descriptive name:
```bash
git checkout -b feature/your-feature-name
# Examples:
# feature/persistence-layer
# bugfix/timer-drift
# docs/update-readme
# style/dark-mode-polish
```

**3. Make changes and commit often**
```bash
git add .
git commit -m "feat: add break duration stepper to timer"
```

Commit message prefixes:
| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code restructure (no behavior change) |
| `style:` | CSS/formatting only |
| `docs:` | Documentation updates |
| `chore:` | Tooling, deps, config |

**4. Keep your branch updated with `main`**
```bash
git fetch origin
git merge origin/main
```
Do this frequently — the longer you wait, the harder merge conflicts become.

**5. Push your branch**
```bash
# First push
git push -u origin feature/your-feature-name

# Subsequent pushes
git push
```

**6. Open a Pull Request**
1. Go to the [GitHub repo](https://github.com/l4hgs/FocusFlow).
2. Click **"Compare & pull request"** on your branch.
3. Describe what the PR does and why.
4. Request a review from a teammate.
5. Once approved → **Squash & Merge** into `main`.

---

## 🔌 API Reference (Key Endpoints)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/focus/timer` | Get current timer state (includes work/break minutes) |
| `POST` | `/api/focus/timer/start` | Start the timer |
| `POST` | `/api/focus/timer/pause` | Pause the timer |
| `POST` | `/api/focus/timer/tick` | Advance timer by 1 second (called by frontend interval) |
| `POST` | `/api/focus/timer/reset` | Reset to default work session |
| `POST` | `/api/focus/timer/switch` | Manually switch work ↔ break |
| `PUT` | `/api/focus/timer/settings` | Update `{ workMinutes, breakMinutes }` |
| `GET` | `/api/focus/subjects` | List all subjects with nested tasks |
| `POST` | `/api/focus/subjects` | Create a new subject |
| `DELETE` | `/api/focus/subjects/{id}` | Delete a subject and all its tasks |
| `POST` | `/api/focus/subjects/{id}/tasks` | Add a task to a subject |
| `PATCH` | `/api/focus/subjects/{id}/tasks/{taskId}/toggle` | Toggle task completion |
| `DELETE` | `/api/focus/subjects/{id}/tasks/{taskId}` | Delete a task |

---

## ✅ Before Opening a PR Checklist

- [ ] `dotnet build` passes in `backend/` with **0 errors**
- [ ] `npm run dev` runs without errors in `frontend/`
- [ ] Feature works in both **light mode** and **dark mode**
- [ ] Feature works in **offline mode** (backend not running)
- [ ] No hardcoded `rgba(...)` color values — use CSS variables only
- [ ] Commit messages follow the prefix convention

---

> Questions? Ping the channel or open a GitHub Discussion. Happy shipping! 🚀
