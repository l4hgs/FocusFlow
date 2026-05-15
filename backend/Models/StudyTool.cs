namespace FocusFlow.Models
{
    /// <summary>
    /// Data / Abstraction Layer – Abstract Base Class for all FocusFlow study tool services.
    ///
    /// OOP Principles enforced here:
    ///   • Abstraction  – declares the contract (Initialize / Reset) without implementation.
    ///   • Encapsulation – toolName is a private backing field; exposed only through a
    ///                     protected setter so subclasses can write it but callers cannot.
    ///   • Inheritance  – every concrete service (Timer, Reader, Orchestrator) extends this
    ///                     class and is guaranteed to honour the contract.
    ///
    /// UML Notes:
    ///   # toolName : string   (protected field – UML notation)
    ///   + isActive : bool     (public field – UML notation)
    ///   + Initialize() : void (abstract)
    ///   + Reset()      : void (abstract)
    /// </summary>
    public abstract class StudyTool
    {
        // ── Protected Fields (UML: # toolName) ────────────────────────────────
        // Private backing field; subclasses assign via the protected setter.
        private string _toolName = string.Empty;

        /// <summary>
        /// Displays the tool name; subclasses overwrites this to set their specific name.
        /// </summary>
        public string ToolName
        {
            get => _toolName;
            protected set => _toolName = value?.Trim() ?? string.Empty;
        }

        // ── Public Fields (UML: + isActive) ───────────────────────────────────
        /// <summary>
        /// Indicates whether this tool is currently in an active (running) state.
        /// Subclasses manage the flag; external callers may read it.
        /// </summary>
        public bool IsActive { get; protected set; } = false;

        // ── Abstract Contract ─────────────────────────────────────────────────

        /// <summary>
        /// Polymorphic initialisation: each concrete tool sets its default state.
        /// Must be called by the DI container / constructor after creation.
        /// </summary>
        public abstract void Initialize();

        /// <summary>
        /// Polymorphic reset: returns the tool to its initial post-construction state
        /// without changing registered settings (e.g., configured durations).
        /// </summary>
        public abstract void Reset();

        // ── Shared Behaviour ──────────────────────────────────────────────────

        /// <summary>
        /// Activates the tool. Concrete subclasses may override to add side-effects.
        /// </summary>
        public virtual void Activate()   => IsActive = true;

        /// <summary>
        /// Deactivates the tool. Concrete subclasses may override to add side-effects.
        /// </summary>
        public virtual void Deactivate() => IsActive = false;
    }
}
