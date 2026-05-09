using FocusFlow.Models;

namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – Dynamic Subject Orchestrator.
    ///
    /// OOP Principles:
    ///   • Inheritance   – extends StudyTool; participates in the polymorphic hierarchy.
    ///   • Encapsulation – the internal _subjects list is private; external callers
    ///                     receive only IReadOnlyList projections, preventing direct
    ///                     mutation of the collection from outside.
    ///   • Polymorphism  – Initialize() seeds the default academic data set;
    ///                     Reset() purges all runtime data and re-seeds to defaults.
    ///
    /// Aggregation Pattern:
    ///   SubjectOrchestratorService owns the lifecycle of SubjectEntity objects,
    ///   each of which aggregates a collection of TaskEntity objects.
    ///   Neither entity type manages its own persistence; all mutations flow
    ///   through the orchestrator's public API.
    /// </summary>
    public class SubjectOrchestratorService : FocusFlow.Models.StudyTool
    {
        // ── Private State (Encapsulation) ─────────────────────────────────────
        // Callers receive IReadOnlyList<SubjectEntity> – they cannot Add/Remove
        // directly; all mutations must go through the orchestrator's API.
        private readonly List<SubjectEntity> _subjects = new();

        // ── Constructor ───────────────────────────────────────────────────────

        public SubjectOrchestratorService()
        {
            ToolName = "Subject Orchestrator";
            Initialize(); // Seed default data via the polymorphic contract
        }

        // ── Abstract Method Implementations (Polymorphism) ────────────────────

        /// <summary>
        /// Seeds the orchestrator with a representative set of academic subjects
        /// and tasks. Called once on construction and again by Reset().
        /// </summary>
        public override void Initialize()
        {
            _subjects.Clear();

            // ── Seed: Biology Lab Report ──────────────────────────────────────
            var bio = CreateSubject("Biology Lab Report", "🔬", "#5E9E7E");
            AddTask(bio.Id, "Analyze spectrophotometer data", 2);
            AddTask(bio.Id, "Draft Methods section",          1);
            AddTask(bio.Id, "Format citations (APA)",         1);
            // Seed one completed task to demonstrate the Done list
            CompleteTask(bio.Id, bio.Tasks[0].Id);

            // ── Seed: Calculus II ─────────────────────────────────────────────
            var calc = CreateSubject("Calculus II", "∫", "#6C8EBF");
            AddTask(calc.Id, "Practice integration by parts", 3);
            AddTask(calc.Id, "Review Taylor series notes",    2);
        }

        /// <summary>
        /// Clears all subjects and tasks, then re-seeds to the default data set.
        /// Useful for a full session reset without recycling the singleton.
        /// </summary>
        public override void Reset()
        {
            Initialize(); // Single source of truth: re-run the seed
        }

        // ── Subject CRUD ──────────────────────────────────────────────────────

        /// <summary>
        /// Returns all subjects as a read-only list.
        /// Encapsulation: callers cannot mutate the backing collection directly.
        /// </summary>
        public IReadOnlyList<SubjectEntity> GetAll() => _subjects.AsReadOnly();

        /// <summary>Returns a single Subject by its GUID, or null if not found.</summary>
        public SubjectEntity? GetById(Guid id) =>
            _subjects.FirstOrDefault(s => s.Id == id);

        /// <summary>
        /// Instantiates a new SubjectEntity and appends it to the orchestrator's
        /// private collection (Aggregation pattern).
        /// </summary>
        public SubjectEntity CreateSubject(string name,
                                           string icon  = "📚",
                                           string color = "#6C8EBF")
        {
            var subject = new SubjectEntity
            {
                Name  = name.Trim(),
                Icon  = icon,
                Color = color,
            };
            _subjects.Add(subject);
            return subject;
        }

        /// <summary>Removes a Subject and all of its aggregated Tasks.</summary>
        public bool DeleteSubject(Guid subjectId)
        {
            var subject = FindSubject(subjectId);
            if (subject is null) return false;
            _subjects.Remove(subject);
            return true;
        }

        // ── Task CRUD ─────────────────────────────────────────────────────────

        /// <summary>Appends a new TaskEntity to the given Subject's aggregated collection.</summary>
        public TaskEntity? AddTask(Guid subjectId, string description, int priorityLevel = 1)
        {
            var subject = FindSubject(subjectId);
            if (subject is null) return null;

            var task = new TaskEntity
            {
                SubjectId     = subjectId,
                Description   = description.Trim(),
                PriorityLevel = Math.Clamp(priorityLevel, 1, 3),
                Status        = Models.TaskStatus.Active,
            };
            subject.Tasks.Add(task);
            return task;
        }

        // ── Automated Lifecycle Management ────────────────────────────────────

        /// <summary>
        /// Rule-based transition: marks the task as Done and records a CompletedAt timestamp.
        /// Triggered when the user checks off a task in the UI.
        /// </summary>
        public SubjectEntity? CompleteTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return null;

            task.Status      = Models.TaskStatus.Done;
            task.CompletedAt = DateTimeOffset.UtcNow;
            return subject;
        }

        /// <summary>Reactivates a Done task back to Active (undo completion).</summary>
        public SubjectEntity? UncompleteTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return null;

            task.Status      = Models.TaskStatus.Active;
            task.CompletedAt = null;
            return subject;
        }

        /// <summary>
        /// High-level toggle: flips a task between Active and Done.
        /// Returns the updated Subject (with recalculated ProgressPercent).
        /// </summary>
        public SubjectEntity? ToggleTask(Guid subjectId, Guid taskId)
        {
            var (_, task) = FindTask(subjectId, taskId);
            if (task is null) return null;

            return task.Status == Models.TaskStatus.Done
                ? UncompleteTask(subjectId, taskId)
                : CompleteTask(subjectId, taskId);
        }

        /// <summary>Permanently removes a TaskEntity from its parent Subject's collection.</summary>
        public bool DeleteTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return false;
            subject.Tasks.Remove(task);
            return true;
        }

        // ── Private Helpers (Encapsulation) ───────────────────────────────────

        private SubjectEntity? FindSubject(Guid id) =>
            _subjects.FirstOrDefault(s => s.Id == id);

        private (SubjectEntity? subject, TaskEntity? task) FindTask(Guid subjectId, Guid taskId)
        {
            var subject = FindSubject(subjectId);
            var task    = subject?.Tasks.FirstOrDefault(t => t.Id == taskId);
            return (subject, task);
        }
    }
}
