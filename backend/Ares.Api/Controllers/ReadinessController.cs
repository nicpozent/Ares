using System.Text.Json;
using Ares.Api.Data;
using Ares.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ares.Api.Controllers;

/// <summary>
/// Readiness surfaces: on-call/paging and the status page are stored as jsonb
/// documents (whole-doc GET/PUT); runbooks and SLOs are first-class rows.
/// </summary>
[ApiController]
[Route("api/readiness")]
public class ReadinessController : ControllerBase
{
    private readonly AresDbContext _db;
    public ReadinessController(AresDbContext db) => _db = db;

    // ---- doc-backed surfaces (oncall | statusPage) ------------------------
    [HttpGet("{key}")]
    public async Task<ActionResult<JsonElement>> GetDoc(string key)
    {
        if (key is not ("oncall" or "statusPage")) return BadRequest("Unknown readiness key.");
        var doc = await _db.ReadinessDocs.FindAsync(key);
        var json = doc?.Json ?? "{}";
        return JsonDocument.Parse(json).RootElement.Clone();
    }

    [HttpPut("{key}")]
    public async Task<IActionResult> PutDoc(string key, [FromBody] JsonElement body)
    {
        if (key is not ("oncall" or "statusPage")) return BadRequest("Unknown readiness key.");
        var doc = await _db.ReadinessDocs.FindAsync(key);
        if (doc is null) { doc = new ReadinessDoc { Key = key }; _db.ReadinessDocs.Add(doc); }
        doc.Json = body.GetRawText();
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController]
[Route("api/runbooks")]
public class RunbooksController : ControllerBase
{
    private readonly AresDbContext _db;
    public RunbooksController(AresDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<Runbook>> List() =>
        await _db.Runbooks.AsNoTracking().ToListAsync();

    [HttpPut("{id}")]
    public async Task<ActionResult<Runbook>> Update(string id, Runbook req)
    {
        var rb = await _db.Runbooks.FindAsync(id);
        if (rb is null) return NotFound();
        rb.Title = req.Title; rb.Service = req.Service; rb.Trigger = req.Trigger;
        rb.Owner = req.Owner; rb.LastRun = req.LastRun; rb.Steps = req.Steps;
        await _db.SaveChangesAsync();
        return rb;
    }

    /// <summary>Attach a runbook to an incident — logs a DECISION event on its timeline.</summary>
    [HttpPost("{id}/attach/{incidentId}")]
    public async Task<IActionResult> Attach(string id, string incidentId)
    {
        var rb = await _db.Runbooks.FindAsync(id);
        var inc = await _db.Incidents.Include(i => i.Timeline).FirstOrDefaultAsync(i => i.Id == incidentId);
        if (rb is null || inc is null) return NotFound();
        var ord = inc.Timeline.Count == 0 ? 0 : inc.Timeline.Max(t => t.Ordinal) + 1;
        inc.Timeline.Add(new TimelineEvent
        {
            Id = "t" + Guid.NewGuid().ToString("N")[..8], IncidentId = inc.Id,
            T = DateTime.UtcNow.ToString("HH:mm:ss"), Type = "DECISION", Src = "Runbook",
            Text = "Runbook attached: " + rb.Title, Ordinal = ord
        });
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

[ApiController]
[Route("api/slos")]
public class SlosController : ControllerBase
{
    private readonly AresDbContext _db;
    public SlosController(AresDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<Slo>> List() => await _db.Slos.AsNoTracking().ToListAsync();
}
