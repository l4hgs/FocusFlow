namespace FocusFlow.Models
{
    /// <summary>
    /// Data Layer – core task entity supporting lifecycle states and subject grouping.
    /// Aggregated by SubjectEntity; managed by SubjectOrchestratorService.
    /// </summary>
    public class TaskEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Description { get; set; } = string.Empty;

        /// <summary>Priority level 1 (low) to 3 (high). Used for task ordering.</summary>
        public int PriorityLevel { get; set; } = 1;

        /// <summary>Foreign key – the Subject this task belongs to.</summary>
        public Guid SubjectId { get; set; }

        /// <summary>Lifecycle state. Toggle IsCompleted to trigger automated transition.</summary>
        public TaskStatus Status { get; set; } = TaskStatus.Active;

        /// <summary>Convenience accessor; setting true moves task to Done automatically.</summary>
        public bool IsCompleted
        {
            get => Status == TaskStatus.Done;
            set => Status = value ? TaskStatus.Done : TaskStatus.Active;
        }

        /// <summary>Optional sub-tasks (nested decomposition).</summary>
        public List<TaskEntity> SubTasks { get; set; } = new();

        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public DateTimeOffset? CompletedAt { get; set; }
    }
}
