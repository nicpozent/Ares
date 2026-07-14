using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Ares.Api.Data;

/// <summary>
/// Design-time factory so `dotnet ef migrations …` can build the context without
/// running the web host. Uses ConnectionStrings__Postgres if set, else a local
/// default (migrations generation doesn't connect, it only needs the provider).
/// </summary>
public class AresDbContextFactory : IDesignTimeDbContextFactory<AresDbContext>
{
    public AresDbContext CreateDbContext(string[] args)
    {
        var conn = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
                   ?? "Host=localhost;Port=5432;Database=ares;Username=ares;Password=ares";
        var options = new DbContextOptionsBuilder<AresDbContext>()
            .UseNpgsql(conn)
            .Options;
        return new AresDbContext(options);
    }
}
