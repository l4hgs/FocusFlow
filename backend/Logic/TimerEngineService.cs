namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – manages Pomodoro timer state on the server.
    /// Now supports:
    ///   • Configurable work and break durations (in minutes).
    ///   • Manual session switching (work ↔ break) via SwitchSession().
    ///   • Settings update without requiring a full reset.
    /// </summary>
    public class TimerEngineService : FocusFlow.Models.StudyTool
    {
        // Durations in seconds (server-of-truth)
        private int _workDuration  = 1500;  // 25 minutes
        private int _breakDuration = 300;   //  5 minutes

        private int  _secondsRemaining;
        private bool _isWorkSession = true;

        public TimerEngineService()
        {
            ToolName          = "Pomodoro Timer";
            _secondsRemaining = _workDuration;
        }

        // ── Initialization ────────────────────────────────────────────────────

        public override void Initialize()
        {
            _isWorkSession    = true;
            _secondsRemaining = _workDuration;
            IsActive          = false;
        }

        // ── Read ──────────────────────────────────────────────────────────────

        public TimerSnapshot GetSnapshot() =>
            new(_secondsRemaining, _isWorkSession, IsActive,
                _workDuration / 60, _breakDuration / 60);

        // ── Controls ──────────────────────────────────────────────────────────

        public TimerSnapshot Start()
        {
            IsActive = true;
            return GetSnapshot();
        }

        public TimerSnapshot Pause()
        {
            IsActive = false;
            return GetSnapshot();
        }

        public TimerSnapshot Tick()
        {
            if (!IsActive) return GetSnapshot();

            if (_secondsRemaining > 0)
                _secondsRemaining--;
            else
                AutoSwitchSession();

            return GetSnapshot();
        }

        public TimerSnapshot Reset()
        {
            Initialize();
            return GetSnapshot();
        }

        /// <summary>
        /// Manually switch between work and break session.
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
        /// Update work and/or break durations.
        /// Resets remaining time if the current session type's duration changed.
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

            // Reset remaining time only for the currently-active session type
            if (_isWorkSession  && workChanged)  _secondsRemaining = _workDuration;
            if (!_isWorkSession && breakChanged) _secondsRemaining = _breakDuration;

            return GetSnapshot();
        }

        // ── Private ───────────────────────────────────────────────────────────

        /// <summary>Called automatically at end of countdown.</summary>
        private void AutoSwitchSession()
        {
            _isWorkSession    = !_isWorkSession;
            _secondsRemaining = _isWorkSession ? _workDuration : _breakDuration;
        }
    }

    /// <summary>Immutable snapshot of timer state sent to the client.</summary>
    /// <param name="SecondsRemaining">Seconds left in the current session.</param>
    /// <param name="IsWorkSession">True = work, False = break.</param>
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
