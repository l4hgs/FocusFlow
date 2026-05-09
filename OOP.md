# FocusFlow: An OOP-Driven Academic Workspace
### Architectural Blueprint — Senior Software Architect Review

---

> [!NOTE]
> This document maps the four pillars of Object-Oriented Programming (OOP) — plus the structural bond of Composition & Aggregation — directly onto FocusFlow's 3-Layer ASP.NET backend. Every concept is grounded in actual source code from the `Models/` and `Logic/` namespaces.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│           PRESENTATION LAYER  (Controllers/)            │
│              FocusController.cs                         │
│   Calls high-level methods only: Tick(), Reset(), ...   │
└────────────────────────┬────────────────────────────────┘
                         │  calls
┌────────────────────────▼────────────────────────────────┐
│         BUSINESS LOGIC LAYER  (Logic/)                  │
│   TimerEngineService  ──┐                               │
│   AdaptiveReaderService ├──► all inherit StudyTool      │
│   SubjectOrchestratorService ──┘                        │
│   TaskManagerService   ─┘                               │
└────────────────────────┬────────────────────────────────┘
                         │  operates on
┌────────────────────────▼────────────────────────────────┐
│              DATA MODEL LAYER  (Models/)                │
│   StudyTool (abstract)   SubjectEntity                  │
│   TaskEntity             TaskStatus (enum)              │
│   TimerSnapshot (record)                                │
└─────────────────────────────────────────────────────────┘
```

---

## Section 1 — Abstraction: The Blueprint

### Core Concept
Abstraction means exposing **what** an object does without revealing **how** it does it. In C#, this is achieved with `abstract` classes and methods, which define a mandatory contract every subclass must fulfil.

### The `StudyTool` Abstract Class

`StudyTool` is the single source of architectural truth for every tool in FocusFlow. It answers the question: *"What does any study tool fundamentally need to do?"*

```csharp
// Models/StudyTool.cs
public abstract class StudyTool
{
    private string _toolName = string.Empty;

    public string ToolName
    {
        get => _toolName;
        protected set => _toolName = value?.Trim() ?? string.Empty;
    }

    public bool IsActive { get; protected set; } = false;

    // THE CONTRACT — every concrete tool MUST implement these:
    public abstract void Initialize();  // set default state
    public abstract void Reset();       // return to default state
}
```

### Abstract Members and Their Purpose

- **`Initialize()`** — Forces every tool to define what its "ready state" looks like. There is no default. If a developer adds a new tool and forgets to implement this, the compiler refuses to build.
- **`Reset()`** — Forces every tool to define what "starting over" means. For the Timer, that's returning to a 25-minute work session. For the Orchestrator, it's re-seeding the default subjects.

> **Real-World FocusFlow Example:**
> You cannot call `new StudyTool()` — the compiler blocks it. This means a vague, half-defined "tool" can never exist at runtime. Every object the system creates is guaranteed to be a fully-realised, lifecycle-aware feature: a Timer, a Reader, or an Orchestrator.

---

## Section 2 — Inheritance: The Hierarchy

### Core Concept
Inheritance models the **"is-a"** relationship. A subclass receives all the fields and behaviours of its parent, then extends or overrides them. This eliminates redundant code and enforces structural consistency.

### The Inheritance Chain

```
StudyTool  (abstract — Models/)
    │
    ├── TimerEngineService       (Logic/)  "is-a" StudyTool
    ├── AdaptiveReaderService    (Logic/)  "is-a" StudyTool
    ├── SubjectOrchestratorService (Logic/) "is-a" StudyTool
    └── TaskManagerService       (Logic/)  "is-a" StudyTool
```

### What Each Service Inherits for Free

| Inherited Member | Type | What it provides |
|---|---|---|
| `ToolName` | `string` property | A human-readable label for logging and debugging |
| `IsActive` | `bool` property | A uniform on/off flag usable by any tool |
| `Activate()` | `virtual` method | Sets `IsActive = true` — can be overridden |
| `Deactivate()` | `virtual` method | Sets `IsActive = false` — can be overridden |

### Preventing Incomplete Objects

The `abstract` keyword on `StudyTool` prevents instantiation directly:

```csharp
// ✅ Legal — concrete, fully-implemented
var timer = new TimerEngineService();

// ❌ Compiler Error: Cannot create an instance of the abstract class 'StudyTool'
var tool  = new StudyTool();
```

> **Real-World FocusFlow Example:**
> The `TimerEngineService` constructor sets `ToolName = "Pomodoro Timer"` using the protected setter it *inherited* from `StudyTool`. It didn't need to re-declare that field — the hierarchy provided it for free. If a future developer adds a `FlashcardService`, they get `ToolName` and `IsActive` automatically; they only need to write what is unique to flashcards.

---

## Section 3 — Encapsulation: The Protective Layer

### Core Concept
Encapsulation bundles data and the methods that operate on it into a single unit, then **restricts direct external access** to the internal state. Outside callers interact through a controlled public interface only.

### Access Modifier Strategy

FocusFlow uses a deliberate, consistent access-modifier convention:

| Modifier | Usage | Example |
|---|---|---|
| `private` | Internal state variables — never readable outside | `_secondsRemaining`, `_subjects`, `_fontSize` |
| `protected` | Base-class members writable by subclasses only | `IsActive` setter, `ToolName` setter |
| `public` | The intentional API surface for the controller | `Tick()`, `ApplyBionicFormatting()`, `GetAll()` |

### `TimerEngineService` — Encapsulation in Detail

```csharp
// Logic/TimerEngineService.cs

// PRIVATE — the controller never sees these raw values:
private int  _workDuration     = 1500;  // seconds
private int  _breakDuration    = 300;
private int  _secondsRemaining;
private bool _isWorkSession    = true;

// PUBLIC — the controller calls these clean methods:
public TimerSnapshot Tick()         // advance one second
public TimerSnapshot Start()        // set IsActive = true
public TimerSnapshot UpdateSettings(int workMinutes, int breakMinutes)
```

The controller **cannot** do `_timer._secondsRemaining = 0` to cheat the timer. The only path in is through `Tick()` or `Reset()`. This guarantees the Pomodoro rules are always enforced by the server.

### `AdaptiveReaderService` — Read-Only Property Exposure

```csharp
// Private mutable fields:
private int  _fontSize;
private bool _bionicModeEnabled;

// Public read-only properties — callers can observe but not corrupt:
public int  FontSize          => _fontSize;
public bool BionicModeEnabled => _bionicModeEnabled;

// Mutation only through controlled methods:
public int  SetFontSize(int sizePx)  // clamps to [12, 32]
public bool ToggleBionicMode()       // flips the flag safely
```

> **Real-World FocusFlow Example:**
> If `_secondsRemaining` were `public`, a buggy React component could accidentally post `seconds = -100`, breaking the timer permanently. Encapsulation means the `Tick()` method is the *only* path to modify time, and it applies the `if (_secondsRemaining > 0)` guard every time — no exceptions.

---

## Section 4 — Composition & Aggregation: The Structural Bond

### Core Concept
These describe **"has-a"** relationships between objects.
- **Composition** — the child cannot exist without the parent (strong ownership).
- **Aggregation** — the parent owns or manages the child, but the child is a conceptually independent entity (weak ownership).

### The Aggregation Chain in FocusFlow

```
SubjectOrchestratorService
    │
    │  privately owns (aggregates)
    ▼
SubjectEntity  [ "Biology Lab", "Calculus II", ... ]
    │
    │  aggregates (List<TaskEntity>)
    ▼
TaskEntity     [ "Draft Methods", "Format citations", ... ]
    │
    │  aggregates (List<TaskEntity> SubTasks)
    ▼
TaskEntity     [ nested sub-tasks — recursive self-reference ]
```

### `SubjectEntity` — The Aggregate Root

```csharp
// Models/SubjectEntity.cs
public class SubjectEntity
{
    public Guid Id    { get; set; } = Guid.NewGuid();
    public string Name  { get; set; } = string.Empty;

    // AGGREGATION — Subject owns a collection of Tasks:
    public List<TaskEntity> Tasks { get; set; } = new();

    // COMPUTED PROPERTIES — derived from the aggregate, not stored:
    public int DoneCount      => Tasks.Count(t => t.Status == TaskStatus.Done);
    public int TotalCount     => Tasks.Count(t => t.Status != TaskStatus.Deleted);
    public int ProgressPercent => TotalCount == 0
                                  ? 0
                                  : (int)Math.Round((double)DoneCount / TotalCount * 100);
}
```

### Why the Orchestrator Owns Lifecycle, Not the Entities

The `SubjectOrchestratorService` keeps `_subjects` as a **private** list. This means:

1. `SubjectEntity` objects cannot add themselves to the system.
2. `TaskEntity` objects cannot reassign their own `SubjectId`.
3. All lifecycle operations (`AddTask`, `CompleteTask`, `DeleteSubject`) flow through one authoritative service.

This is the **Single Responsibility Principle** expressed through aggregation: the entities hold data, the orchestrator manages relationships.

> **Real-World FocusFlow Example:**
> When you call `DELETE /api/focus/subjects/{id}`, the orchestrator removes the `SubjectEntity` from `_subjects`. Because the tasks live *inside* that subject's `Tasks` list (aggregation), they are garbage-collected with it. No orphaned tasks can exist — the structural bond enforces referential integrity in memory.

---

## Section 5 — Polymorphism: The Adaptive Behaviour

### Core Concept
Polymorphism means "many forms." The same method call produces different behaviour depending on the *actual type* of the object at runtime. In C#, this is achieved via `abstract` / `virtual` / `override`.

### How `Initialize()` Behaves Differently Across Tools

All four services are `StudyTool` instances. All four implement `Initialize()`. But the *meaning* of initialization is completely different for each:

```csharp
// TimerEngineService.Initialize()
public override void Initialize()
{
    _isWorkSession    = true;      // always start with work
    _secondsRemaining = _workDuration; // reset to 25 min
    IsActive          = false;     // paused by default
}

// AdaptiveReaderService.Initialize()
public override void Initialize()
{
    _fontSize          = 16;   // default font size (px)
    _bionicModeEnabled = true; // Bionic Reading on by default
    IsActive           = false;
}

// SubjectOrchestratorService.Initialize()
public override void Initialize()
{
    _subjects.Clear();
    // Seed academic demo data:
    var bio = CreateSubject("Biology Lab Report", "🔬", "#5E9E7E");
    AddTask(bio.Id, "Analyze spectrophotometer data", 2);
    // ...
}

// TaskManagerService.Initialize()
public override void Initialize()
{
    IsActive = true; // Board is always ready — no seed data
}
```

### Polymorphic Dispatch — One Call, Four Behaviours

If the system held all tools in a shared list (e.g., at app startup or for a batch reset), it could call `Initialize()` uniformly without knowing the concrete type:

```csharp
// Hypothetical startup orchestration (demonstrates polymorphic dispatch):
List<StudyTool> allTools = new()
{
    new TimerEngineService(),
    new AdaptiveReaderService(),
    new SubjectOrchestratorService(),
    new TaskManagerService(),
};

foreach (var tool in allTools)
{
    tool.Initialize(); // ← Each tool executes ITS OWN version
}
```

The loop treats every item as a `StudyTool`. At runtime, C#'s virtual dispatch table routes each call to the correct concrete override automatically.

### The `Reset()` Delegation Pattern

`Reset()` in this codebase uses a deliberate pattern: every concrete service implements `Reset()` by delegating to its own `Initialize()`. This ensures a **single source of truth** for what "default state" means:

```csharp
// TimerEngineService — Reset delegates to Initialize:
public override void Reset() => Initialize();

// AdaptiveReaderService — same pattern:
public override void Reset() => Initialize();

// SubjectOrchestratorService — clears and re-seeds:
public override void Reset() => Initialize();
```

> **Real-World FocusFlow Example:**
> The `FocusController` calls `_timer.ResetAndSnapshot()`. It has no knowledge of Pomodoro rules, session states, or work durations. The controller simply calls a method on a `TimerEngineService` reference — the object's own polymorphic implementation handles everything. If `TimerEngineService` is later replaced with a `FlowStateTimerService`, the controller doesn't need to change at all.

---

## Summary Table

| Pillar | Where Applied | Enforced By |
|---|---|---|
| **Abstraction** | `StudyTool` defines the contract | `abstract` keyword — compiler-enforced |
| **Inheritance** | All 4 services extend `StudyTool` | `: StudyTool` syntax + inherited members |
| **Encapsulation** | Private fields in all Logic services | `private` / `protected` access modifiers |
| **Aggregation** | `SubjectEntity` owns `TaskEntity` list | Private `_subjects` list in Orchestrator |
| **Polymorphism** | `Initialize()` / `Reset()` per service | `abstract` + `override` keywords |

---

> [!TIP]
> **Next architectural step:** When FocusFlow adds persistence (e.g., Entity Framework Core), the Encapsulation boundary is what makes it safe. Only the service classes need to change their backing store — the `FocusController` presentation layer remains completely untouched, because it was never allowed to access internal state directly.
