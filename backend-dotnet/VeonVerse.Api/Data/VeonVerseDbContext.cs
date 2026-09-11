using Microsoft.EntityFrameworkCore;
using VeonVerse.Api.Configuration;
using VeonVerse.Api.Entities;

namespace VeonVerse.Api.Data;

/// <summary>
/// The Entity Framework Core database context — the .NET counterpart of SQLAlchemy's
/// <c>Base</c> / <c>SessionLocal</c> pair in <c>backend/app/database.py</c> and
/// <c>backend/app/models.py</c>.
/// </summary>
/// <remarks>
/// <para><b>Why the explicit column names.</b> The Python app created these tables with
/// snake_case names (<c>official_text</c>, <c>user_id</c>, ...). EF Core would default to
/// the C# PascalCase property names instead, which would not match. Every column is
/// therefore mapped by hand below so both stacks read and write the same physical table.
/// Get one of these wrong and the query fails at runtime, not at compile time.</para>
///
/// <para><b>Lifetime.</b> Registered as a scoped service in <c>Program.cs</c>, so one
/// context is created per HTTP request and disposed when the request ends. That mirrors
/// the FastAPI <c>get_db()</c> dependency, which yielded a session per request.</para>
/// </remarks>
public class VeonVerseDbContext : DbContext
{
    public VeonVerseDbContext(DbContextOptions<VeonVerseDbContext> options) : base(options)
    {
    }

    public DbSet<Principle> Principles => Set<Principle>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProgress> UserProgress => Set<UserProgress>();
    public DbSet<Badge> Badges => Set<Badge>();
    public DbSet<UserBadge> UserBadges => Set<UserBadge>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<LeadershipChunk> LeadershipChunks => Set<LeadershipChunk>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Tells Npgsql that this database uses the pgvector extension, so the `vector`
        // column type and its distance operators are understood.
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<Principle>(entity =>
        {
            entity.ToTable("principles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Number).HasColumnName("number").IsRequired();
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
            entity.Property(e => e.OfficialText).HasColumnName("official_text").IsRequired();
            entity.Property(e => e.Summary).HasColumnName("summary").IsRequired();
            entity.Property(e => e.PsychometricTension).HasColumnName("psychometric_tension");
            entity.Property(e => e.HoganCompetencies).HasColumnName("hogan_competencies");
            entity.Property(e => e.BehavioralDomains).HasColumnName("behavioral_domains");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Xp).HasColumnName("xp").HasDefaultValue(0).IsRequired();
            entity.Property(e => e.Level).HasColumnName("level").HasDefaultValue(1).IsRequired();
            entity.Property(e => e.StreakCount).HasColumnName("streak_count").HasDefaultValue(1).IsRequired();
            entity.Property(e => e.LastActiveDay).HasColumnName("last_active_day").HasMaxLength(10);
        });

        modelBuilder.Entity<UserProgress>(entity =>
        {
            entity.ToTable("user_progress");
            // Composite key: one progress row per (user, principle) pair.
            entity.HasKey(e => new { e.UserId, e.PrincipleId });
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.PrincipleId).HasColumnName("principle_id");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("not_started").IsRequired();
            entity.Property(e => e.CurrentStep).HasColumnName("current_step").HasMaxLength(50).HasDefaultValue("intro").IsRequired();
            entity.Property(e => e.ChosenScenarioAnswer).HasColumnName("chosen_scenario_answer");
            entity.Property(e => e.ReflectionResponse).HasColumnName("reflection_response");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");

            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Principle).WithMany().HasForeignKey(e => e.PrincipleId);
        });

        modelBuilder.Entity<Badge>(entity =>
        {
            entity.ToTable("badges");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.Name).HasColumnName("name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Criteria).HasColumnName("criteria").IsRequired();
        });

        modelBuilder.Entity<UserBadge>(entity =>
        {
            entity.ToTable("user_badges");
            entity.HasKey(e => new { e.UserId, e.BadgeId });
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.BadgeId).HasColumnName("badge_id");
            entity.Property(e => e.EarnedAt).HasColumnName("earned_at");

            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
            entity.HasOne(e => e.Badge).WithMany().HasForeignKey(e => e.BadgeId);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("chat_messages");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Role).HasColumnName("role").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Content).HasColumnName("content").IsRequired();
            // SQLAlchemy declared this as a generic JSON column, so it must stay `json`
            // (not Npgsql's default `jsonb`) for the two stacks to agree on the type.
            entity.Property(e => e.RetrievedChunkIds).HasColumnName("retrieved_chunk_ids").HasColumnType("json");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.User).WithMany().HasForeignKey(e => e.UserId);
        });

        modelBuilder.Entity<LeadershipChunk>(entity =>
        {
            entity.ToTable("leadership_chunks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedOnAdd();
            entity.Property(e => e.ChunkText).HasColumnName("chunk_text").IsRequired();
            // The dimension must match EMBEDDING_DIMENSION (384) and the vectors already
            // written by the Python ingestion script.
            entity.Property(e => e.Embedding)
                  .HasColumnName("embedding")
                  .HasColumnType($"vector({VeonVerseOptions.EmbeddingDimensionDefault})")
                  .IsRequired();
            entity.Property(e => e.PrincipleId).HasColumnName("principle_id").IsRequired();
            entity.Property(e => e.ChunkType).HasColumnName("chunk_type").HasMaxLength(50);
            entity.Property(e => e.SourceUrl).HasColumnName("source_url").HasMaxLength(1024).IsRequired();

            entity.HasIndex(e => e.PrincipleId);
        });

        base.OnModelCreating(modelBuilder);
    }
}
