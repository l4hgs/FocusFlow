<h1 align="center">
  <br>
  ⚡ FocusFlow
  <br>
</h1>

<h4 align="center">A minimalist, Neumorphic productivity suite for deep work and cognitive enhancement.</h4>

<p align="center">
  <a href="#key-features">Key Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#how-to-run-locally">How To Run Locally</a> •
  <a href="#architecture">Architecture</a>
</p>

## Description

**FocusFlow** is designed to eliminate distractions and accelerate cognitive processing. Built with a sleek, monochromatic Neumorphic UI, it seamlessly integrates tools required for intense study and focused work sessions without overwhelming the user.

## Key Features

* **⏱️ Deep Focus Timer** 
  * Server-synced Pomodoro timer with a dark circular progress ring. 
  * Avoids browser tab-throttling drift by keeping the source of truth in the C# backend.
  * Features auto-start toggles for continuous flow.
* **📖 Adaptive Bionic Reader**
  * Implements an algorithm that bolds the first 40% of every word, anchoring your visual fixation.
  * Reduces subvocalization and significantly increases reading speed.
* **📋 Task Decomposition**
  * Break down complex goals into simple, manageable sub-tasks.
  * Visual progress bars and smooth completion animations.
* **🔌 Graceful Degradation**
  * Operates in a robust "Local Mode" fully within the browser if the backend is unavailable.

## Tech Stack

**Frontend:**
* [React 18](https://reactjs.org/) & [Vite](https://vitejs.dev/)
* Pure CSS (Custom Neumorphic Design System)

**Backend:**
* [.NET 10 Web API](https://dotnet.microsoft.com/apps/aspnet/apis) (C#)
* In-Memory State Management (3-Layer Architecture)

---

## How To Run Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/en/) (v18 or higher)
* [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/l4hgs/FocusFlow.git
   cd FocusFlow
   ```

2. **Start the Backend (API)**
   Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   dotnet run
   ```
   > The API will start running on `http://localhost:5000`.

3. **Start the Frontend (UI)**
   Open a *second* terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   > The Vite development server will start on `http://localhost:5173`.

4. **Experience Deep Work**
   Open your browser and navigate to [http://localhost:5173](http://localhost:5173). 
   You will see the "API Online" indicator in the top right if the connection to the backend is successful.

## Architecture

FocusFlow strictly follows a **3-Layer Architecture**:
1. **Data Layer** (`backend/Models`): Core entities like `TaskEntity` and `StudyTool`.
2. **Business Logic Layer** (`backend/Logic`): Computations such as `AdaptiveReaderService` and `TimerEngineService`.
3. **Presentation Layer**: 
   * API: `backend/Controllers/FocusController.cs`
   * UI: React thin-client in `/frontend`

---

> Built with focus. ⚡
