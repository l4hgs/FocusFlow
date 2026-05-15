namespace FocusFlow.Models
{
    /// <summary>
    /// Data Layer – parent container for an academic category (e.g., "Biology", "Calculus").
    /// Aggregates a collection of TaskEntity objects. The SubjectOrchestratorService owns
    /// all lifecycle operations on both Subjects and their Tasks.
    /// </summary>
    public class SubjectEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>Determines what subject for task decomposer</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Accent color hex for the Subject card UI (e.g., "#6C8EBF").</summary>
        public string Color { get; set; } = "#6C8EBF";

        /// <summary>Emoji icon for visual identity on the card header.</summary>
        public string Icon { get; set; } = "📚";

        /// <summary>Aggregated task collection – managed exclusively via the orchestrator.</summary>
        public List<TaskEntity> Tasks { get; set; } = new();

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

        // ── Computed properties (read-only) ────────────────────────────────────

        /// <summary>Count of tasks with Status = Done within this Subject.</summary>
        public int DoneCount => Tasks.Count(t => t.Status == TaskStatus.Done);

        /// <summary>Total task count (excludes Deleted tasks from denominator).</summary>
        public int TotalCount => Tasks.Count(t => t.Status != TaskStatus.Deleted);

        /// <summary>
        /// Decomposition Progress percentage (0–100).
        /// Calculated as Done / Total within this Subject.
        /// </summary>
        public int ProgressPercent => TotalCount == 0 ? 0 : (int)Math.Round((double)DoneCount / TotalCount * 100);
    }
}
