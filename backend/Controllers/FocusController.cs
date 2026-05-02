using FocusFlow.Logic;
using Microsoft.AspNetCore.Mvc;

namespace FocusFlow.API.Controllers
{
    /// <summary>
    /// Presentation Layer (API) – bridges React thin-client with BLL services.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class FocusController : ControllerBase
    {
        private readonly AdaptiveReaderService _reader;
        private readonly TimerEngineService _timer;
        private readonly TaskManagerService _tasks;

        public FocusController(
            AdaptiveReaderService reader,
            TimerEngineService timer,
            TaskManagerService tasks)
        {
            _reader = reader;
            _timer = timer;
            _tasks = tasks;
        }

        // ── Bionic Reader ──────────────────────────────────────────────────
        [HttpPost("process-reader")]
        public IActionResult GetBionicText([FromBody] string text)
        {
            var processed = _reader.ProcessBionicText(text);
            return Ok(new { html = processed });
        }

        // ── Timer ──────────────────────────────────────────────────────────
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

        // ── Tasks ──────────────────────────────────────────────────────────
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

        [HttpPost("tasks/{id}/subtasks")]
        public IActionResult AddSubTask(Guid id, [FromBody] string description)
        {
            if (!_tasks.AddSubTask(id, description)) return NotFound();
            return Ok(_tasks.GetAll());
        }
    }

    public record AddTaskRequest(string Description, int PriorityLevel = 1);
}
