namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – manages Pomodoro timer state on the server.
    ///
    /// OOP Principles:
    ///   • Inheritance   – extends StudyTool, honouring the abstract contract.
    ///   • Encapsulation – all mutable state (_workDuration, _secondsRemaining, etc.)
    ///                     is private; the outside world reads state only through
    ///                     GetSnapshot() or the public controls below.
    ///   • Polymorphism  – Initialize() sets post-construction defaults; Reset()
    ///                     returns to the initial session without wiping settings.
    ///
    /// Features:
    ///   • Configurable work / break durations (minutes).
    ///   • Manual session switching (work ↔ break) via SwitchSession().
    ///   • Settings update without requiring a full Reset().
    /// </summary>
    public class TimerEngineService : FocusFlow.Models.StudyTool
    {
        // ── Private State (Encapsulation) ─────────────────────────────────────
        // Durations are stored in seconds (server-of-truth).
        // External callers see them only as minutes via the TimerSnapshot DTO.
        private int _workDuration  = 1500;   // 25 minutes default
        private int _breakDuration = 300;    //  5 minutes default

        private int  _secondsRemaining;
        private bool _isWorkSession = true;  // work session starts first

        // ── Constructor ───────────────────────────────────────────────────────

        public TimerEngineService()
        {
            // Encapsulation: ToolName is set via the protected base setter.
            ToolName          = "Pomodoro Timer";
            _secondsRemaining = _workDuration;
        }

        // ── Abstract Method Implementations (Polymorphism) ────────────────────

        /// <summary>
        /// Sets the timer to its initial work-session state.
        /// Called once on construction and again by Reset().
        /// </summary>
        public override void Initialize()
        {
            _isWorkSession    = true;
            _secondsRemaining = _workDuration;
            IsActive          = false;   // protected setter from base class
        }

        /// <summary>
        /// Returns the timer to the starting session state without altering
        /// the configured work/break durations.
        /// Delegates to Initialize() – the canonical "default state" definition.
        /// </summary>
        public override void Reset()
        {
            Initialize();
        }

        // ── Public Read API ───────────────────────────────────────────────────

        /// <summary>
        /// Returns an immutable snapshot of the current timer state.
        /// This is the ONLY public window into private mutable state.
        /// </summary>
        public TimerSnapshot GetSnapshot() =>
            new(_secondsRemaining, _isWorkSession, IsActive,
                _workDuration / 60, _breakDuration / 60);

        // ── Public Control API ────────────────────────────────────────────────

        /// <summary>Starts the countdown. Returns the updated snapshot.</summary>
        public TimerSnapshot Start()
        {
            Activate();   // calls base.Activate() → IsActive = true
            return GetSnapshot();
        }

        /// <summary>Pauses the countdown. Returns the updated snapshot.</summary>
        public TimerSnapshot Pause()
        {
            Deactivate(); // calls base.Deactivate() → IsActive = false
            return GetSnapshot();
        }

        /// <summary>
        /// Advances the timer by one second.
        /// Automatically switches sessions when the countdown reaches zero.
        /// Returns the updated snapshot.
        /// </summary>
        public TimerSnapshot Tick()
        {
            if (!IsActive) return GetSnapshot();

            if (_secondsRemaining > 0)
                _secondsRemaining--;
            else
                AutoSwitchSession();

            return GetSnapshot();
        }

        /// <summary>
        /// Resets the timer to the initial work-session state and returns the snapshot.
        /// Satisfies the API surface used by FocusController (timer/reset endpoint).
        /// </summary>
        public TimerSnapshot ResetAndSnapshot()
        {
            Reset();
            return GetSnapshot();
        }

        /// <summary>
        /// Manually switches between work and break session.
        /// Resets the timer to the target session's full duration.
        /// Does NOT change IsActive state.
        /// </summary>
        public TimerSnapshot SwitchSession()
        {
            _isWorkSession    = !_isWorkSession;
            _secondsRemaining = _isWorkSession ? _workDuration : _breakDuration;
            return GetSnapshot();
        }

        /// <summary>
        /// Updates work and/or break durations.
        /// Resets remaining time only if the current session type's duration changed.
        /// </summary>
        /// <param name="workMinutes">Work session length in minutes (1–120).</param>
        /// <param name="breakMinutes">Break session length in minutes (1–60).</param>
        public TimerSnapshot UpdateSettings(int workMinutes, int breakMinutes)
        {
            int clampedWork  = Math.Clamp(workMinutes,  1, 120);
            int clampedBreak = Math.Clamp(breakMinutes, 1,  60);

            bool workChanged  = clampedWork  * 60 != _workDuration;
            bool breakChanged = clampedBreak * 60 != _breakDuration;

            _workDuration  = clampedWork  * 60;
            _breakDuration = clampedBreak * 60;

            // Reset remaining time only for the currently-active session type.
            if (_isWorkSession  && workChanged)  _secondsRemaining = _workDuration;
            if (!_isWorkSession && breakChanged) _secondsRemaining = _breakDuration;

            return GetSnapshot();
        }

        // ── Private Helpers (Encapsulation) ───────────────────────────────────

        /// <summary>Called automatically at end of countdown to flip the session.</summary>
        private void AutoSwitchSession()
        {
            _isWorkSession    = !_isWorkSession;
            _secondsRemaining = _isWorkSession ? _workDuration : _breakDuration;
        }
    }

    /// <summary>Immutable snapshot of timer state sent to the client.</summary>
    /// <param name="SecondsRemaining">Seconds left in the current session.</param>
    /// <param name="IsWorkSession">True = work session; False = break session.</param>
    /// <param name="IsActive">Whether the timer is currently running.</param>
    /// <param name="WorkMinutes">Configured work session duration in minutes.</param>
    /// <param name="BreakMinutes">Configured break session duration in minutes.</param>
    public record TimerSnapshot(
        int  SecondsRemaining,
        bool IsWorkSession,
        bool IsActive,
        int  WorkMinutes,
        int  BreakMinutes);
}
