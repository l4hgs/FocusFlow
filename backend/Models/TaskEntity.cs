namespace FocusFlow.Models
{
    /// <summary>
    /// Data Layer – core task entity. Supports nested subtasks and priority levels.
    /// </summary>
    public class TaskEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; } = false;
        /// <summary>1 = Low, 2 = Medium, 3 = High</summary>
        public int PriorityLevel { get; set; } = 1;
        public List<TaskEntity> SubTasks { get; set; } = new List<TaskEntity>();
    }
}
