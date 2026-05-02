using FocusFlow.Models;

namespace FocusFlow.Logic
{
    /// <summary>
    /// Business Logic Layer – in-memory CRUD for TaskEntity objects.
    /// Swap the backing store for a DB provider without touching controllers.
    /// </summary>
    public class TaskManagerService
    {
        private readonly List<TaskEntity> _tasks = new();

        public IReadOnlyList<TaskEntity> GetAll() => _tasks.AsReadOnly();

        public TaskEntity Add(string description, int priorityLevel = 1)
        {
            var task = new TaskEntity
            {
                Description = description,
                PriorityLevel = Math.Clamp(priorityLevel, 1, 3)
            };
            _tasks.Add(task);
            return task;
        }

        public bool Toggle(Guid id)
        {
            var task = Find(id);
            if (task is null) return false;
            task.IsCompleted = !task.IsCompleted;
            return true;
        }

        public bool Delete(Guid id)
        {
            var task = Find(id);
            if (task is null) return false;
            _tasks.Remove(task);
            return true;
        }

        public bool AddSubTask(Guid parentId, string description)
        {
            var parent = Find(parentId);
            if (parent is null) return false;
            parent.SubTasks.Add(new TaskEntity { Description = description });
            return true;
        }

        private TaskEntity? Find(Guid id) => _tasks.FirstOrDefault(t => t.Id == id);
    }
}
