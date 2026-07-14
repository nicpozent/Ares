using Ares.Api.Data;
using Ares.Api.Models;
using Ares.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Ares.Api.Controllers;

/// <summary>
/// Microsoft Teams war-room integration: provision an incident channel and post
/// the Adaptive Card via Microsoft Graph. Degrades gracefully when Graph or the
/// ops Team id is not configured.
/// </summary>
[ApiController]
[Route("api/incidents/{id}/teams")]
public class TeamsController : ControllerBase
{
    private readonly AresDbContext _db;
    private readonly GraphService _graph;
    private readonly TeamsOptions _teams;
    private readonly ILogger<TeamsController> _log;

    public TeamsController(AresDbContext db, GraphService graph, IOptions<TeamsOptions> teams, ILogger<TeamsController> log)
    { _db = db; _graph = graph; _teams = teams.Value; _log = log; }

    [HttpGet("status")]
    public async Task<ActionResult<object>> Status(string id)
    {
        var inc = await _db.Incidents.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        return new
        {
            graphConfigured = _graph.IsConfigured,
            teamsConfigured = _teams.IsConfigured,
            provisioned = !string.IsNullOrWhiteSpace(inc.TeamsChannelId),
            channelId = inc.TeamsChannelId,
            channelUrl = inc.TeamsChannelUrl,
        };
    }

    [HttpPost("provision")]
    public async Task<ActionResult<object>> Provision(string id, CancellationToken ct)
    {
        var guard = Guard();
        if (guard is not null) return guard;

        var inc = await _db.Incidents
            .Include(i => i.Timeline).Include(i => i.Hypotheses)
            .FirstOrDefaultAsync(i => i.Id == id, ct);
        if (inc is null) return NotFound();

        try
        {
            if (string.IsNullOrWhiteSpace(inc.TeamsChannelId))
            {
                var (channelId, webUrl) = await _graph.CreateWarRoomChannelAsync(_teams.TeamId, inc, ct);
                inc.TeamsChannelId = channelId;
                inc.TeamsChannelUrl = webUrl;
            }
            await _graph.PostAdaptiveCardAsync(_teams.TeamId, inc.TeamsChannelId!, BuildCard(inc), ct);

            var ord = inc.Timeline.Count == 0 ? 0 : inc.Timeline.Max(t => t.Ordinal) + 1;
            inc.Timeline.Add(new TimelineEvent
            {
                Id = "t" + Guid.NewGuid().ToString("N")[..8], IncidentId = inc.Id,
                T = DateTime.UtcNow.ToString("HH:mm:ss"), Type = "ROSTER", Src = "Graph",
                Text = "Teams war-room channel provisioned and Adaptive Card posted.", Ordinal = ord
            });
            await _db.SaveChangesAsync(ct);
            return new { provisioned = true, channelId = inc.TeamsChannelId, channelUrl = inc.TeamsChannelUrl };
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Teams provision failed for {Incident}", id);
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "Teams provisioning failed: " + ex.Message });
        }
    }

    [HttpPost("post-card")]
    public async Task<ActionResult<object>> PostCard(string id, CancellationToken ct)
    {
        var guard = Guard();
        if (guard is not null) return guard;

        var inc = await _db.Incidents.Include(i => i.Hypotheses).FirstOrDefaultAsync(i => i.Id == id, ct);
        if (inc is null) return NotFound();
        if (string.IsNullOrWhiteSpace(inc.TeamsChannelId))
            return BadRequest(new { error = "No Teams channel provisioned for this incident yet." });

        try
        {
            await _graph.PostAdaptiveCardAsync(_teams.TeamId, inc.TeamsChannelId!, BuildCard(inc), ct);
            return new { posted = true };
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Teams post-card failed for {Incident}", id);
            return StatusCode(StatusCodes.Status502BadGateway, new { error = "Posting the card failed: " + ex.Message });
        }
    }

    private ActionResult? Guard()
    {
        if (!_graph.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "Microsoft Graph is not configured." });
        if (!_teams.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "No ops Team id configured (set Teams:TeamId)." });
        return null;
    }

    private string BuildCard(Incident inc)
    {
        var dir = _db.Directory.AsNoTracking().ToDictionary(d => d.Id, d => d.Name);
        return AdaptiveCardBuilder.Build(inc, uid => dir.GetValueOrDefault(uid));
    }
}
