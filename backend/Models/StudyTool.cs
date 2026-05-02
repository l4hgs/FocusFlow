namespace FocusFlow.Models
{
    /// <summary>
    /// Data Layer – abstract base for all study tool services.
    /// Concrete tools (Timer, Reader, etc.) extend this class.
    /// </summary>
    public abstract class StudyTool
    {
        public string ToolName { get; protected set; } = string.Empty;
        public bool IsActive { get; set; } = false;

        /// <summary>Initialise the tool's internal state.</summary>
        public abstract void Initialize();
    }
}
