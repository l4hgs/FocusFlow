using FocusFlow.Logic;
using FocusFlow.Models;
using Microsoft.AspNetCore.Mvc;

namespace FocusFlow.API.Controllers
{
    /// <summary>
    /// Presentation Layer (API) – bridges the React thin-client with BLL services.
    /// Subjects endpoint: /api/focus/subjects
    /// Legacy tasks endpoint: /api/focus/tasks  (kept for backward compatibility)
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class FocusController : ControllerBase
    {
        private readonly AdaptiveReaderService       _reader;
        private readonly TimerEngineService          _timer;
        private readonly TaskManagerService          _tasks;
        private readonly SubjectOrchestratorService  _orchestrator;

        public FocusController(
            AdaptiveReaderService      reader,
            TimerEngineService         timer,
            TaskManagerService         tasks,
            SubjectOrchestratorService orchestrator)
        {
            _reader       = reader;
            _timer        = timer;
            _tasks        = tasks;
            _orchestrator = orchestrator;
        }

        // ── Bionic Reader ──────────────────────────────────────────────────────
        [HttpPost("process-reader")]
        public IActionResult GetBionicText([FromBody] string text)
        {
            var processed = _reader.ProcessBionicText(text);
            return Ok(new { html = processed });
        }

        // ── Timer ──────────────────────────────────────────────────────────────
        [HttpGet("timer")]
        public IActionResult GetTimerState() => Ok(_timer.GetSnapshot());

        [HttpPost("timer/start")]
        public IActionResult StartTimer() => Ok(_timer.Start());

        [HttpPost("timer/pause")]
        public IActionResult PauseTimer() => Ok(_timer.Pause());

        [HttpPost("timer/tick")]
        public IActionResult TickTimer() => Ok(_timer.Tick());

        [HttpPost("timer/reset")]
        public IActionResult ResetTimer() => Ok(_timer.Reset());

        /// <summary>
        /// POST /api/focus/timer/switch
        /// Manually switch between work and break session.
        /// Resets the countdown to the target session's full duration.
        /// </summary>
        [HttpPost("timer/switch")]
        public IActionResult SwitchSession() => Ok(_timer.SwitchSession());

        /// <summary>
        /// PUT /api/focus/timer/settings
        /// Update work and break durations (in minutes).
        /// Immediately resets remaining time if the current session type's length changed.
        /// </summary>
        [HttpPut("timer/settings")]
        public IActionResult UpdateTimerSettings([FromBody] UpdateTimerSettingsRequest req)
        {
            var snapshot = _timer.UpdateSettings(req.WorkMinutes, req.BreakMinutes);
            return Ok(snapshot);
        }

        // ── Legacy Tasks (backward compatibility) ──────────────────────────────
        [HttpGet("tasks")]
        public IActionResult GetTasks() => Ok(_tasks.GetAll());

        [HttpPost("tasks")]
        public IActionResult AddTask([FromBody] AddTaskRequest req)
        {
            var task = _tasks.Add(req.Description, req.PriorityLevel);
            return Ok(task);
        }

        [HttpPatch("tasks/{id}/toggle")]
        public IActionResult ToggleTask(Guid id)
        {
            if (!_tasks.Toggle(id)) return NotFound();
            return Ok(_tasks.GetAll());
        }

        [HttpDelete("tasks/{id}")]
        public IActionResult DeleteTask(Guid id)
        {
            if (!_tasks.Delete(id)) return NotFound();
            return Ok(_tasks.GetAll());
        }

        // ── Subject Orchestrator ───────────────────────────────────────────────

        /// <summary>GET all subjects with their nested task collections.</summary>
        [HttpGet("subjects")]
        public IActionResult GetSubjects() => Ok(_orchestrator.GetAll());

        /// <summary>GET a single subject by ID.</summary>
        [HttpGet("subjects/{subjectId}")]
        public IActionResult GetSubject(Guid subjectId)
        {
            var subject = _orchestrator.GetById(subjectId);
            return subject is null ? NotFound() : Ok(subject);
        }

        /// <summary>POST – instantiate a new Subject object.</summary>
        [HttpPost("subjects")]
        public IActionResult CreateSubject([FromBody] CreateSubjectRequest req)
        {
            var subject = _orchestrator.CreateSubject(req.Name, req.Icon, req.Color);
            return Ok(subject);
        }

        /// <summary>DELETE – remove an entire Subject and all its tasks.</summary>
        [HttpDelete("subjects/{subjectId}")]
        public IActionResult DeleteSubject(Guid subjectId)
        {
            if (!_orchestrator.DeleteSubject(subjectId)) return NotFound();
            return Ok(_orchestrator.GetAll());
        }

        // ── Task Lifecycle within a Subject ────────────────────────────────────

        /// <summary>POST – append a task to a Subject's collection.</summary>
        [HttpPost("subjects/{subjectId}/tasks")]
        public IActionResult AddSubjectTask(Guid subjectId, [FromBody] AddTaskRequest req)
        {
            var task = _orchestrator.AddTask(subjectId, req.Description, req.PriorityLevel);
            if (task is null) return NotFound();
            return Ok(_orchestrator.GetById(subjectId));
        }

        /// <summary>
        /// PATCH – toggle IsCompleted. Immediately triggers automated lifecycle transition.
        /// Completed → Done list; Done → reactivated to Active.
        /// </summary>
        [HttpPatch("subjects/{subjectId}/tasks/{taskId}/toggle")]
        public IActionResult ToggleSubjectTask(Guid subjectId, Guid taskId)
        {
            var subject = _orchestrator.ToggleTask(subjectId, taskId);
            return subject is null ? NotFound() : Ok(subject);
        }

        /// <summary>DELETE – permanently removes a task from the Subject.</summary>
        [HttpDelete("subjects/{subjectId}/tasks/{taskId}")]
        public IActionResult DeleteSubjectTask(Guid subjectId, Guid taskId)
        {
            if (!_orchestrator.DeleteTask(subjectId, taskId)) return NotFound();
            return Ok(_orchestrator.GetById(subjectId));
        }
    }

    // ── Request DTOs ───────────────────────────────────────────────────────────
    public record AddTaskRequest(string Description, int PriorityLevel = 1);
    public record CreateSubjectRequest(string Name, string Icon = "📚", string Color = "#6C8EBF");

    /// <param name="WorkMinutes">Work session duration in minutes (1–120).</param>
    /// <param name="BreakMinutes">Break session duration in minutes (1–60).</param>
    public record UpdateTimerSettingsRequest(int WorkMinutes, int BreakMinutes);
}
