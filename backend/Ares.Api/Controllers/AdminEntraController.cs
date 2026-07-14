using Ares.Api.Data;
using Ares.Api.Dtos;
using Ares.Api.Models;
using Ares.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ares.Api.Controllers;

/// <summary>
/// Admin-only Entra directory import via Microsoft Graph. Browse groups and
/// enterprise-app assignments, then import the chosen principals into the ARES
/// directory where they can be mapped to ARES roles.
/// </summary>
[ApiController]
[Route("api/admin/entra")]
public class AdminEntraController : ControllerBase
{
    private readonly GraphService _graph;
    private readonly AresDbContext _db;
    private readonly ILogger<AdminEntraController> _log;

    public AdminEntraController(GraphService graph, AresDbContext db, ILogger<AdminEntraController> log)
    { _graph = graph; _db = db; _log = log; }

    [HttpGet("status")]
    public object Status() => new { configured = _graph.IsConfigured };

    [HttpGet("groups")]
    public async Task<ActionResult<IEnumerable<GraphGroupDto>>> Groups([FromQuery] string? query, CancellationToken ct)
        => await Guarded(() => _graph.SearchGroupsAsync(query, ct));

    [HttpGet("groups/{id}/members")]
    public async Task<ActionResult<IEnumerable<GraphPrincipalDto>>> GroupMembers(string id, CancellationToken ct)
        => await Guarded(() => _graph.GetGroupMembersAsync(id, ct));

    [HttpGet("apps")]
    public async Task<ActionResult<IEnumerable<GraphAppDto>>> Apps([FromQuery] string? query, CancellationToken ct)
        => await Guarded(() => _graph.SearchEnterpriseAppsAsync(query, ct));

    [HttpGet("apps/{id}/assignments")]
    public async Task<ActionResult<IEnumerable<GraphPrincipalDto>>> AppAssignments(string id, CancellationToken ct)
        => await Guarded(() => _graph.GetAppAssignedPrincipalsAsync(id, ct));

    /// <summary>Persist selected Entra principals into the ARES directory (upsert by Entra id).</summary>
    [HttpPost("import")]
    public async Task<ActionResult<object>> Import(ImportRequest req)
    {
        if (req.Principals is null || req.Principals.Count == 0)
            return BadRequest("No principals supplied.");

        int added = 0, updated = 0;
        foreach (var item in req.Principals)
        {
            var existing = await _db.Directory.FirstOrDefaultAsync(d => d.EntraId == item.EntraId)
                           ?? await _db.Directory.FirstOrDefaultAsync(d => d.Email == item.Email && item.Email != "");
            if (existing is null)
            {
                _db.Directory.Add(new DirectoryPrincipal
                {
                    Id = (item.Type == "group" ? "g-" : "u-") + Guid.NewGuid().ToString("N")[..8],
                    Name = item.Name, Email = item.Email, Type = item.Type,
                    Roles = item.Roles ?? new List<string> { "viewer" },
                    EntraId = item.EntraId, EntraSource = item.Source
                });
                added++;
            }
            else
            {
                existing.Name = item.Name;
                if (!string.IsNullOrWhiteSpace(item.Email)) existing.Email = item.Email;
                existing.EntraId = item.EntraId;
                existing.EntraSource = item.Source ?? existing.EntraSource;
                if (item.Roles is { Count: > 0 })
                    existing.Roles = existing.Roles.Union(item.Roles).Distinct().ToList();
                updated++;
            }
        }
        await _db.SaveChangesAsync();
        _log.LogInformation("Entra import: {Added} added, {Updated} updated.", added, updated);
        return new { added, updated, total = added + updated };
    }

    private async Task<ActionResult<IEnumerable<T>>> Guarded<T>(Func<Task<List<T>>> op)
    {
        if (!_graph.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { error = "Microsoft Graph is not configured. Set Entra credentials to enable import." });
        try
        {
            return await op();
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Graph call failed.");
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "Microsoft Graph request failed: " + ex.Message });
        }
    }
}
