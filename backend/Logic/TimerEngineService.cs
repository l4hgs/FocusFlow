namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – manages Pomodoro timer state on the server.
    /// Prevents drift caused by tab-switching or throttled JS timers.
    /// </summary>
    public class TimerEngineService : FocusFlow.Models.StudyTool
    {
        private int _secondsRemaining;
        private bool _isWorkSession = true;

        public TimerEngineService()
        {
            ToolName = "Pomodoro Timer";
            _secondsRemaining = 1500; // 25 minutes default
        }

        public override void Initialize()
        {
            _isWorkSession = true;
            _secondsRemaining = 1500;
            IsActive = false;
        }

        public TimerSnapshot GetSnapshot() =>
            new(_secondsRemaining, _isWorkSession, IsActive);

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
                ToggleSessionType();

            return GetSnapshot();
        }

        public TimerSnapshot Reset()
        {
            Initialize();
            return GetSnapshot();
        }

        private void ToggleSessionType()
        {
            _isWorkSession = !_isWorkSession;
            _secondsRemaining = _isWorkSession ? 1500 : 300; // 25 min | 5 min
        }
    }

    /// <summary>Immutable snapshot of timer state sent to the client.</summary>
    public record TimerSnapshot(int SecondsRemaining, bool IsWorkSession, bool IsActive);
}
