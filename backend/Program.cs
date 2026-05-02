using FocusFlow.Logic;

var builder = WebApplication.CreateBuilder(args);

// ── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddControllers();

// Register BLL services as singletons (in-memory state shared across requests)
builder.Services.AddSingleton<AdaptiveReaderService>();
builder.Services.AddSingleton<TimerEngineService>();
builder.Services.AddSingleton<TaskManagerService>();

// ── CORS – allow Vite dev server ──────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// Seed the timer so it's ready at startup
app.Services.GetRequiredService<TimerEngineService>().Initialize();

app.UseCors();
app.MapControllers();

app.Run();
