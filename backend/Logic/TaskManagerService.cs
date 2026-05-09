using FocusFlow.Models;

namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – flat (non-subject-grouped) in-memory CRUD for TaskEntity.
    ///
    /// OOP Principles:
    ///   • Inheritance   – extends StudyTool; guaranteed to implement Initialize() / Reset().
    ///   • Encapsulation – _tasks list is private; callers receive IReadOnlyList<TaskEntity>.
    ///   • Polymorphism  – Initialize() configures an empty task board; Reset() flushes it.
    ///
    /// Note: This service handles the legacy /api/focus/tasks endpoint.
    /// New development should use SubjectOrchestratorService for grouped task management.
    /// </summary>
    public class TaskManagerService : FocusFlow.Models.StudyTool
    {
        // ── Private State (Encapsulation) ─────────────────────────────────────
        private readonly List<TaskEntity> _tasks = new();

        // ── Constructor ───────────────────────────────────────────────────────

        public TaskManagerService()
        {
            ToolName = "Task Manager";
            Initialize();
        }

        // ── Abstract Method Implementations (Polymorphism) ────────────────────

        /// <summary>
        /// Initialises the task manager in a clean, empty state.
        /// No seed data – this board starts blank and fills via API calls.
        /// </summary>
        public override void Initialize()
        {
            // Board starts empty; tasks are added at runtime via Add().
            IsActive = true; // The task board is always "active" (ready to accept tasks).
        }

        /// <summary>
        /// Flushes all tasks and resets to a clean empty board.
        /// Useful for end-of-session cleanup.
        /// </summary>
        public override void Reset()
        {
            _tasks.Clear();
            Initialize();
        }

        // ── Public Read API ───────────────────────────────────────────────────

        /// <summary>Returns all tasks as a read-only list.</summary>
        public IReadOnlyList<TaskEntity> GetAll() => _tasks.AsReadOnly();

        // ── Public Mutation API ───────────────────────────────────────────────

        /// <summary>Creates and appends a new TaskEntity to the board.</summary>
        public TaskEntity Add(string description, int priorityLevel = 1)
        {
            var task = new TaskEntity
            {
                Description   = description.Trim(),
                PriorityLevel = Math.Clamp(priorityLevel, 1, 3),
            };
            _tasks.Add(task);
            return task;
        }

        /// <summary>Toggles IsCompleted on the specified task. Returns false if not found.</summary>
        public bool Toggle(Guid id)
        {
            var task = FindById(id);
            if (task is null) return false;
            task.IsCompleted = !task.IsCompleted;
            return true;
        }

        /// <summary>Permanently removes a task from the board.</summary>
        public bool Delete(Guid id)
        {
            var task = FindById(id);
            if (task is null) return false;
            _tasks.Remove(task);
            return true;
        }

        /// <summary>Appends a nested sub-task to a parent task.</summary>
        public bool AddSubTask(Guid parentId, string description)
        {
            var parent = FindById(parentId);
            if (parent is null) return false;
            parent.SubTasks.Add(new TaskEntity { Description = description.Trim() });
            return true;
        }

        // ── Private Helpers (Encapsulation) ───────────────────────────────────

        private TaskEntity? FindById(Guid id) =>
            _tasks.FirstOrDefault(t => t.Id == id);
    }
}
