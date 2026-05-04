namespace FocusFlow.Models
{
    /// <summary>
    /// Data Layer – lifecycle states for TaskEntity.
    /// Drives automated transitions in the SubjectOrchestratorService.
    /// </summary>
    public enum TaskStatus
    {
        /// <summary>Task is visible in the active workspace.</summary>
        Active = 0,

        /// <summary>Task has been completed – moved to the Done list.</summary>
        Done = 1,

        /// <summary>Task has been deleted (removed from the Subject).</summary>
        Deleted = 4,
    }
}
