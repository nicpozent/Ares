using System.Text.Json;
using Ares.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Ares.Api.Data;

public class AresDbContext : DbContext
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public AresDbContext(DbContextOptions<AresDbContext> options) : base(options) { }

    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<TimelineEvent> TimelineEvents => Set<TimelineEvent>();
    public DbSet<Hypothesis> Hypotheses => Set<Hypothesis>();
    public DbSet<EvidenceItem> EvidenceItems => Set<EvidenceItem>();
    public DbSet<CorrectiveAction> CorrectiveActions => Set<CorrectiveAction>();
    public DbSet<DirectoryPrincipal> Directory => Set<DirectoryPrincipal>();
    public DbSet<IncidentLink> IncidentLinks => Set<IncidentLink>();
    public DbSet<ReadinessDoc> ReadinessDocs => Set<ReadinessDoc>();
    public DbSet<Runbook> Runbooks => Set<Runbook>();
    public DbSet<Slo> Slos => Set<Slo>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Generic jsonb converter for a POCO value object.
        ValueConverter<T, string> JsonConv<T>() => new(
            v => JsonSerializer.Serialize(v, Json),
            v => JsonSerializer.Deserialize<T>(v, Json)!);

        var e = b.Entity<Incident>();
        e.HasKey(x => x.Id);
        e.Property(x => x.Sel).HasConversion(JsonConv<SeverityDimensions>()!).HasColumnType("jsonb");
        e.Property(x => x.Comms).HasConversion(JsonConv<CommsBundle>()!).HasColumnType("jsonb");
        e.Property(x => x.Assign)
            .HasConversion(new ValueConverter<Dictionary<string, string?>, string>(
                v => JsonSerializer.Serialize(v, Json),
                v => JsonSerializer.Deserialize<Dictionary<string, string?>>(v, Json) ?? new()))
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(new ValueComparer<Dictionary<string, string?>>(
                (a, c) => JsonSerializer.Serialize(a, Json) == JsonSerializer.Serialize(c, Json),
                v => v == null ? 0 : JsonSerializer.Serialize(v, Json).GetHashCode(),
                v => JsonSerializer.Deserialize<Dictionary<string, string?>>(JsonSerializer.Serialize(v, Json), Json)!));

        e.HasMany(x => x.Timeline).WithOne(x => x.Incident!).HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.Hypotheses).WithOne(x => x.Incident!).HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.Evidence).WithOne(x => x.Incident!).HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
        e.HasMany(x => x.Actions).WithOne(x => x.Incident!).HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);

        // Child ids (t1, h1, e1, a1 …) are unique only *within* an incident, so
        // the primary key is composite. This matches the prototype's per-incident ids.
        b.Entity<TimelineEvent>().HasKey(x => new { x.IncidentId, x.Id });
        b.Entity<Hypothesis>().HasKey(x => new { x.IncidentId, x.Id });
        b.Entity<EvidenceItem>().HasKey(x => new { x.IncidentId, x.Id });
        b.Entity<CorrectiveAction>().HasKey(x => new { x.IncidentId, x.Id });

        var dir = b.Entity<DirectoryPrincipal>();
        dir.HasKey(x => x.Id);
        dir.Property(x => x.Roles)
            .HasConversion(
                v => JsonSerializer.Serialize(v, Json),
                v => JsonSerializer.Deserialize<List<string>>(v, Json) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (a, c) => a!.SequenceEqual(c!),
                v => v.Aggregate(0, (h, s) => HashCode.Combine(h, s.GetHashCode())),
                v => v.ToList()));

        b.Entity<IncidentLink>().HasKey(x => x.Id);
        b.Entity<ReadinessDoc>().HasKey(x => x.Key);

        var rb = b.Entity<Runbook>();
        rb.HasKey(x => x.Id);
        rb.Property(x => x.Steps).HasConversion(
                v => JsonSerializer.Serialize(v, Json),
                v => JsonSerializer.Deserialize<List<RunbookStep>>(v, Json) ?? new())
            .HasColumnType("jsonb")
            .Metadata.SetValueComparer(new ValueComparer<List<RunbookStep>>(
                (a, c) => JsonSerializer.Serialize(a, Json) == JsonSerializer.Serialize(c, Json),
                v => JsonSerializer.Serialize(v, Json).GetHashCode(),
                v => JsonSerializer.Deserialize<List<RunbookStep>>(JsonSerializer.Serialize(v, Json), Json)!));

        b.Entity<Slo>().HasKey(x => x.Id);
    }
}
