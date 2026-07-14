using Ares.Api.Data;
using Ares.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// ---- Options ---------------------------------------------------------------
builder.Services.Configure<EntraOptions>(builder.Configuration.GetSection("Entra"));
builder.Services.Configure<MailOptions>(builder.Configuration.GetSection("Mail"));
builder.Services.Configure<AresOptions>(builder.Configuration.GetSection("Ares"));

var entra = builder.Configuration.GetSection("Entra").Get<EntraOptions>() ?? new EntraOptions();
var ares = builder.Configuration.GetSection("Ares").Get<AresOptions>() ?? new AresOptions();

// ---- Persistence -----------------------------------------------------------
builder.Services.AddDbContext<AresDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Postgres")));

// ---- Graph (app-only) ------------------------------------------------------
builder.Services.AddSingleton<GraphService>();

// ---- Auth ------------------------------------------------------------------
// Only wire Entra JWT validation when the tenant is configured. Without it the
// API runs open (demo/pilot mode) so the stack is usable before Entra is set up.
if (entra.IsConfigured)
{
    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddMicrosoftIdentityWebApi(
            jwt =>
            {
                var audiences = new List<string>();
                if (!string.IsNullOrWhiteSpace(entra.ApiAudience)) audiences.Add(entra.ApiAudience);
                if (!string.IsNullOrWhiteSpace(entra.ClientId))
                {
                    audiences.Add(entra.ClientId);
                    audiences.Add($"api://{entra.ClientId}");
                }
                jwt.TokenValidationParameters.ValidAudiences = audiences;
            },
            id =>
            {
                id.Instance = entra.Instance;
                id.TenantId = entra.TenantId;
                id.ClientId = entra.ClientId;
            });
}
builder.Services.AddAuthorization();

// ---- CORS ------------------------------------------------------------------
const string CorsPolicy = "ares-web";
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
{
    if (ares.CorsOrigins.Length > 0) p.WithOrigins(ares.CorsOrigins);
    else p.SetIsOriginAllowed(_ => true);
    p.AllowAnyHeader().AllowAnyMethod();
}));

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ---- Migrate/seed ----------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AresDbContext>();
    var log = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    for (var attempt = 1; ; attempt++)
    {
        try
        {
            db.Database.EnsureCreated();
            await SeedData.EnsureSeededAsync(db);
            break;
        }
        catch (Exception ex) when (attempt < 10)
        {
            log.LogWarning(ex, "Database not ready (attempt {Attempt}/10); retrying in 3s…", attempt);
            await Task.Delay(TimeSpan.FromSeconds(3));
        }
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(CorsPolicy);

if (entra.IsConfigured)
{
    app.UseAuthentication();
    app.UseAuthorization();
}

var controllers = app.MapControllers();
// Require a valid token only when Entra is configured AND demo auth is off.
if (entra.IsConfigured && !ares.AllowDemoAuth)
    controllers.RequireAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok", entra = entra.IsConfigured, demoAuth = ares.AllowDemoAuth }));

app.Run();
