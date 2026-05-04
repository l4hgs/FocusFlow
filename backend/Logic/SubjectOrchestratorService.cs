using FocusFlow.Models;

namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – Dynamic Subject Orchestrator.
    /// Manages the full lifecycle of Subject and Task entities in memory.
    /// Implements the rule-based automated task lifecycle transitions.
    /// Pattern: Aggregation – TaskEngine owns TaskEntity collections via SubjectEntity containers.
    /// </summary>
    public class SubjectOrchestratorService
    {
        private readonly List<SubjectEntity> _subjects = new();

        // ── Seed data – demonstrated with realistic academic subjects ────────────
        public SubjectOrchestratorService()
        {
            var bio = CreateSubject("Biology Lab Report", "🔬", "#5E9E7E");
            AddTask(bio.Id, "Analyze spectrophotometer data", 2);
            AddTask(bio.Id, "Draft Methods section", 1);
            AddTask(bio.Id, "Format citations (APA)", 1);
            // Seed one completed task to demonstrate the Done list
            var firstTask = bio.Tasks[0];
            CompleteTask(bio.Id, firstTask.Id);

            var calc = CreateSubject("Calculus II", "∫", "#6C8EBF");
            AddTask(calc.Id, "Practice integration by parts", 3);
            AddTask(calc.Id, "Review Taylor series notes", 2);
        }

        // ── Subject CRUD ─────────────────────────────────────────────────────────

        public IReadOnlyList<SubjectEntity> GetAll() => _subjects.AsReadOnly();

        public SubjectEntity? GetById(Guid id) =>
            _subjects.FirstOrDefault(s => s.Id == id);

        /// <summary>
        /// Instantiate a new Subject object and append it to the orchestrator's collection.
        /// </summary>
        public SubjectEntity CreateSubject(string name, string icon = "📚", string color = "#6C8EBF")
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

        public bool DeleteSubject(Guid subjectId)
        {
            var subject = FindSubject(subjectId);
            if (subject is null) return false;
            _subjects.Remove(subject);
            return true;
        }

        // ── Task CRUD ────────────────────────────────────────────────────────────

        /// <summary>Append a new task to the given Subject's collection.</summary>
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

        // ── Automated Lifecycle Management ───────────────────────────────────────

        /// <summary>
        /// Rule-based transition: sets IsCompleted = true → Status becomes Done.
        /// Triggered immediately when the checkbox is toggled on the frontend.
        /// Records CompletedAt timestamp.
        /// </summary>
        public SubjectEntity? CompleteTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return null;

            task.Status      = Models.TaskStatus.Done;
            task.CompletedAt = DateTimeOffset.UtcNow;
            return subject;
        }

        /// <summary>Reactivate a Done task back to Active.</summary>
        public SubjectEntity? UncompleteTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return null;

            task.Status      = Models.TaskStatus.Active;
            task.CompletedAt = null;
            return subject;
        }

        /// <summary>Toggle IsCompleted; returns the updated Subject (with recalculated progress).</summary>
        public SubjectEntity? ToggleTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return null;

            if (task.Status == Models.TaskStatus.Done)
                return UncompleteTask(subjectId, taskId);
            else
                return CompleteTask(subjectId, taskId);
        }


        /// <summary>Permanently remove a task from the Subject's collection.</summary>
        public bool DeleteTask(Guid subjectId, Guid taskId)
        {
            var (subject, task) = FindTask(subjectId, taskId);
            if (task is null || subject is null) return false;
            subject.Tasks.Remove(task);
            return true;
        }

        // ── Private helpers ──────────────────────────────────────────────────────

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
