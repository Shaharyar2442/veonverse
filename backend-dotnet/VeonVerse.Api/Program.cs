using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Configuration;
using VeonVerse.Api.Data;
using VeonVerse.Api.Services;

// =============================================================================
//  VEONVERSE API — application entry point and composition root.
//
//  Python equivalent: the top of backend/app/main.py, where the FastAPI app is
//  constructed, middleware added and the lifespan hook registered.
//
//  Read this file top to bottom to understand how the app is assembled:
//    1. Load configuration (.env + appsettings.json + environment variables)
//    2. Register services in the dependency injection container
//    3. Build the app and set up the HTTP pipeline
//    4. Prepare the database, then start listening
// =============================================================================

var builder = WebApplication.CreateBuilder(args);

// -----------------------------------------------------------------------------
// 1. CONFIGURATION
// -----------------------------------------------------------------------------
// The repo-root .env is layered in *below* environment variables, so a real
// environment variable always wins. This is what lets the .NET backend share one
// configuration file with the Python backend rather than duplicating settings.

var envFilePath = DotEnvLoader.FindEnvFile(builder.Environment.ContentRootPath);

if (envFilePath is not null)
{
    builder.Configuration.AddInMemoryCollection(DotEnvLoader.Load(envFilePath));
    Console.WriteLine($"[config] Loaded environment file: {envFilePath}");
}
else
{
    Console.WriteLine("[config] No .env found; using appsettings.json and environment variables only.");
}

// Bind flat .env keys onto the options object. Done by hand rather than with
// Configuration.Bind() because the .env names (GROQ_API_KEY) do not match the
// C# property names (GroqApiKey), and being explicit here makes the mapping
// obvious rather than magic.
var options = new VeonVerseOptions();
builder.Configuration.GetSection(VeonVerseOptions.SectionName).Bind(options);

options.GroqApiKey = builder.Configuration["GROQ_API_KEY"] ?? options.GroqApiKey;
options.GroqModelId = builder.Configuration["GROQ_MODEL_ID"] ?? options.GroqModelId;
options.LocalEmbeddingModel = builder.Configuration["LOCAL_EMBEDDING_MODEL"] ?? options.LocalEmbeddingModel;
options.DatabaseUrl = builder.Configuration["DATABASE_URL"] ?? options.DatabaseUrl;

if (int.TryParse(builder.Configuration["EMBEDDING_DIMENSION"], out var embeddingDimension))
{
    options.EmbeddingDimension = embeddingDimension;
}

if (int.TryParse(builder.Configuration["DEFAULT_PRINCIPLE_ID"], out var defaultPrincipleId))
{
    options.DefaultPrincipleId = defaultPrincipleId;
}

if (int.TryParse(builder.Configuration["LESSON_XP_REWARD"], out var lessonXpReward))
{
    options.LessonXpReward = lessonXpReward;
}

// Registered as a concrete singleton so any service can take VeonVerseOptions
// directly, without the IOptions<T> wrapper.
builder.Services.AddSingleton(options);

// -----------------------------------------------------------------------------
// 2. SERVICE REGISTRATION (dependency injection)
// -----------------------------------------------------------------------------
// FastAPI resolved dependencies per-call via Depends(). .NET resolves them from
// this container, and the *lifetime* of each registration is the thing to get
// right:
//
//   Singleton — one instance for the whole process. For expensive, thread-safe,
//               or state-sharing things (the 90 MB ONNX model; the news cache).
//   Scoped    — one instance per HTTP request. For anything holding request
//               state or a database transaction (the DbContext and its users).
//   Transient — a new instance every time it is asked for.
//
// Getting this wrong is a classic source of bugs: a singleton that depends on a
// scoped DbContext would capture one request's context and reuse it forever.

// Database. Scoped by default, matching FastAPI's per-request get_db() session.
var connectionString = DatabaseUrlConverter.ToNpgsqlConnectionString(options.DatabaseUrl);

builder.Services.AddDbContext<VeonVerseDbContext>(dbOptions =>
    dbOptions.UseNpgsql(connectionString, npgsql => npgsql.UseVector()));

// Embeddings: singleton, because loading the model is slow and InferenceSession
// is safe to use concurrently.
builder.Services.AddSingleton<IEmbeddingService, EmbeddingService>();

// Gamification: singleton, because it is pure arithmetic holding no state.
builder.Services.AddSingleton<IGamificationService, GamificationService>();

// News: singleton, because the whole point is a cache shared across requests.
// AddHttpClient gives it a pooled HttpClient with sane socket handling.
builder.Services.AddHttpClient<INewsService, NewsService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(12);
});

// Groq: scoped. Model calls can be slow, so the timeout is generous.
builder.Services.AddHttpClient<IGroqService, GroqService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(90);
});

// Retrieval and lessons: scoped, because both use the per-request DbContext.
builder.Services.AddScoped<IRetrievalService, RetrievalService>();
builder.Services.AddScoped<ILessonService, LessonService>();

// Controllers, with the JSON settings that keep this API wire-compatible with
// the Python one.
builder.Services
    .AddControllers()
    .AddJsonOptions(jsonOptions =>
    {
        // THE important line. C# properties are PascalCase; FastAPI emitted
        // snake_case. This single policy renders OfficialText as
        // "official_text" and StepNumber as "step_number", which is what lets
        // the existing React frontend talk to this API unchanged.
        jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        jsonOptions.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;

        // Accept snake_case on the way in too, case-insensitively, so request
        // bodies like {"user_id": 1} bind to UserId.
        jsonOptions.JsonSerializerOptions.PropertyNameCaseInsensitive = true;

        // Emit nulls rather than omitting them: the frontend checks for the
        // presence of `options`, so dropping the key would change behaviour.
        jsonOptions.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
    });

// Swagger — the counterpart of FastAPI's automatic /docs.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(swagger =>
{
    swagger.SwaggerDoc("v1", new() { Title = options.AppName, Version = "v1" });

    // Surface the XML doc comments from this codebase in the Swagger UI, so the
    // explanations in the source show up in the browser too.
    var xmlPath = Path.Combine(AppContext.BaseDirectory, "VeonVerse.Api.xml");
    if (File.Exists(xmlPath))
    {
        swagger.IncludeXmlComments(xmlPath);
    }
});

// CORS. Wide open, matching the Python version — fine for local development,
// but it must be narrowed to known origins before this is exposed publicly.
builder.Services.AddCors(cors =>
{
    cors.AddDefaultPolicy(policy => policy
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader());
});

var app = builder.Build();

// -----------------------------------------------------------------------------
// 3. HTTP PIPELINE
// -----------------------------------------------------------------------------
// Order matters here: each piece of middleware wraps the next, so CORS must be
// in place before the request reaches a controller.

app.UseCors();

app.UseSwagger();
app.UseSwaggerUI(swagger =>
{
    swagger.SwaggerEndpoint("/swagger/v1/swagger.json", "VEONVERSE API v1");
    // Served at /docs so the URL matches FastAPI's, and existing links keep working.
    swagger.RoutePrefix = "docs";
});

app.MapControllers();

// -----------------------------------------------------------------------------
// 4. DATABASE PREPARATION, THEN START
// -----------------------------------------------------------------------------
// Python equivalent: the `lifespan` context manager in backend/app/main.py.
// A scope is created by hand because the DbContext is scoped and there is no
// HTTP request in play yet at startup.

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<VeonVerseDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // pgvector must exist before a table with a `vector` column can be created.
        await dbContext.Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS vector");

        // Creates any missing tables. EnsureCreated rather than Migrate, because
        // the Python backend owns the schema — this only fills in what is absent
        // on a fresh database and never alters an existing table.
        await dbContext.Database.EnsureCreatedAsync();

        await DatabaseSeeder.SeedAsync(dbContext);

        logger.LogInformation("Database ready and seeded.");
    }
    catch (Exception exception)
    {
        logger.LogError(exception, "Database preparation failed. Is PostgreSQL running and DATABASE_URL correct?");
        throw;
    }
}

app.Run();
