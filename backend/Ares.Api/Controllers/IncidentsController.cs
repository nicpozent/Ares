using Ares.Api.Data;
using Ares.Api.Dtos;
using Ares.Api.Models;
using Ares.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ares.Api.Controllers;

[ApiController]
[Route("api/incidents")]
public class IncidentsController : ControllerBase
{
    private readonly AresDbContext _db;
    public IncidentsController(AresDbContext db) => _db = db;

    private static readonly string[] TimelineTypeOrder = { "ALERT", "CHANGE", "MESSAGE", "DECISION", "SCRIBE", "MILESTONE", "INCIDENT", "ROSTER" };
    private static readonly string[] HypoStatusOrder = { "Suggested", "Investigating", "Probable", "Confirmed", "Rejected" };
    private static readonly string[] EvidenceKindOrder = { "log", "metric", "screenshot", "config", "link", "file" };
    private static readonly string[] PrioOrder = { "P1", "P2", "P3" };
    private static readonly string[] ActionStatusOrder = { "Open", "In progress", "Done" };

    private IQueryable<Incident> Full() => _db.Incidents
        .Include(i => i.Timeline).Include(i => i.Hypotheses)
        .Include(i => i.Evidence).Include(i => i.Actions);

    private static string Now() => DateTime.UtcNow.ToString("HH:mm:ss");

    // ---- read -------------------------------------------------------------
    [HttpGet]
    public async Task<IEnumerable<Incident>> List()
    {
        var list = await Full().AsNoTracking().ToListAsync();
        foreach (var i in list) SortChildren(i);
        // Newest incident id first (INC-2026-0047 before 0046 …)
        return list.OrderByDescending(i => i.Id, StringComparer.Ordinal);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Incident>> Get(string id)
    {
        var inc = await Full().AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        SortChildren(inc);
        return inc;
    }

    private static void SortChildren(Incident i)
    {
        i.Timeline = i.Timeline.OrderBy(x => x.Ordinal).ToList();
        i.Hypotheses = i.Hypotheses.OrderBy(x => x.Ordinal).ToList();
        i.Evidence = i.Evidence.OrderBy(x => x.Ordinal).ToList();
        i.Actions = i.Actions.OrderBy(x => x.Ordinal).ToList();
    }

    // ---- declare / edit ---------------------------------------------------
    [HttpPost]
    public async Task<ActionResult<Incident>> Declare(DeclareRequest req)
    {
        var sev = SeverityEngine.Compute(req.Sel);
        var id = await NextIdAsync();
        var inc = new Incident
        {
            Id = id,
            Title = string.IsNullOrWhiteSpace(req.Title) ? "Untitled incident" : req.Title!,
            Impact = req.Impact ?? "",
            ServiceName = req.ServiceName ?? "",
            Country = req.Country ?? "",
            Sel = req.Sel,
            Sev = sev.Level,
            Status = req.Status ?? "Investigating",
            Started = DateTime.UtcNow.ToString("HH:mm") + " CET",
            Duration = "0 min",
        };
        inc.Timeline.Add(new TimelineEvent { Id = "t" + Guid.NewGuid().ToString("N")[..8], IncidentId = id, T = Now(), Type = "INCIDENT", Src = "ARES", Text = $"{sev.Level} declared. War room + ServiceNow record created.", Ordinal = 0 });
        _db.Incidents.Add(inc);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id }, inc);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Incident>> Edit(string id, DeclareRequest req)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        inc.Title = string.IsNullOrWhiteSpace(req.Title) ? "Untitled incident" : req.Title!;
        inc.Impact = req.Impact ?? "";
        inc.ServiceName = req.ServiceName ?? "";
        inc.Country = req.Country ?? "";
        inc.Sel = req.Sel;
        inc.Sev = SeverityEngine.Compute(req.Sel).Level;
        if (!string.IsNullOrWhiteSpace(req.Status)) inc.Status = req.Status!;
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<Incident>> Patch(string id, IncidentPatch p)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        if (p.Impact is not null) inc.Impact = p.Impact;
        if (p.Status is not null) inc.Status = p.Status;
        if (p.Title is not null) inc.Title = p.Title;
        if (p.Duration is not null) inc.Duration = p.Duration;
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var inc = await _db.Incidents.FindAsync(id);
        if (inc is null) return NotFound();
        _db.Incidents.Remove(inc);
        await _db.IncidentLinks.Where(l => l.IncidentId == id || l.OtherId == id).ExecuteDeleteAsync();
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/resolve")]
    public async Task<ActionResult<Incident>> Resolve(string id)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        inc.Status = "Resolved";
        var ord = (inc.Timeline.Count == 0 ? 0 : inc.Timeline.Max(t => t.Ordinal) + 1);
        inc.Timeline.Add(new TimelineEvent { Id = "t" + Guid.NewGuid().ToString("N")[..8], IncidentId = id, T = Now(), Type = "MILESTONE", Src = "ARES", Text = "Incident resolved by IC. Moving to post-incident review.", Ordinal = ord });
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpPut("{id}/assign/{slot}")]
    public async Task<ActionResult<Incident>> Assign(string id, string slot, AssignRequest req)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        var map = new Dictionary<string, string?>(inc.Assign);
        map[slot] = req.UserId;
        inc.Assign = map;
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    // ---- comms ------------------------------------------------------------
    [HttpPut("{id}/comms/{key}")]
    public async Task<ActionResult<Incident>> EditComms(string id, string key, CommsEditRequest req)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        var draft = Draft(inc, key);
        if (draft is null) return BadRequest("Unknown comms key.");
        draft.Body = req.Body;
        inc.Comms = inc.Comms; // mark modified (jsonb)
        _db.Entry(inc).Property(x => x.Comms).IsModified = true;
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpPost("{id}/comms/{key}/approve")]
    public async Task<ActionResult<Incident>> ToggleApprove(string id, string key)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        var draft = Draft(inc, key);
        if (draft is null) return BadRequest("Unknown comms key.");
        draft.Approved = !draft.Approved;
        _db.Entry(inc).Property(x => x.Comms).IsModified = true;
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    private static CommsDraft? Draft(Incident inc, string key) => key switch
    {
        "tech" => inc.Comms.Tech,
        "exec" => inc.Comms.Exec,
        "sd" => inc.Comms.Sd,
        _ => null
    };

    // ---- generic child collections ----------------------------------------
    [HttpPost("{id}/{collection}")]
    public async Task<ActionResult<Incident>> AddChild(string id, string collection)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        switch (collection)
        {
            case "timeline":
                inc.Timeline.Add(new TimelineEvent { Id = Nid("t"), IncidentId = id, T = Now(), Type = "MESSAGE", Src = "Manual entry", Text = "New event — click to edit", Ordinal = NextOrd(inc.Timeline.Select(x => x.Ordinal)) });
                break;
            case "hypotheses":
                inc.Hypotheses.Insert(0, new Hypothesis { Id = Nid("h"), IncidentId = id, Title = "New hypothesis — click to edit", ForE = "—", AgainstE = "—", Owner = "Unassigned", Status = "Suggested", Ordinal = MinOrd(inc.Hypotheses.Select(x => x.Ordinal)) - 1 });
                break;
            case "evidence":
                inc.Evidence.Add(new EvidenceItem { Id = Nid("e"), IncidentId = id, Kind = "log", Title = "New evidence — click to edit", Source = "—", Ref = "—", By = "ARES user", T = DateTime.UtcNow.ToString("HH:mm"), Note = "Describe what this evidence shows.", Ordinal = NextOrd(inc.Evidence.Select(x => x.Ordinal)) });
                break;
            case "actions":
                inc.Actions.Add(new CorrectiveAction { Id = Nid("a"), IncidentId = id, Desc = "New corrective action — click to edit", Owner = "Unassigned", Due = "TBD", Prio = "P2", Status = "Open", Weak = false, Ordinal = NextOrd(inc.Actions.Select(x => x.Ordinal)) });
                break;
            default:
                return BadRequest("Unknown collection.");
        }
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpPut("{id}/{collection}/{itemId}")]
    public async Task<ActionResult<Incident>> PatchChild(string id, string collection, string itemId, ChildPatch p)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        switch (collection)
        {
            case "timeline":
                var t = inc.Timeline.FirstOrDefault(x => x.Id == itemId); if (t is null) return NotFound();
                if (p.Text is not null) t.Text = p.Text; if (p.T is not null) t.T = p.T;
                if (p.Type is not null) t.Type = p.Type; if (p.Src is not null) t.Src = p.Src;
                break;
            case "hypotheses":
                var h = inc.Hypotheses.FirstOrDefault(x => x.Id == itemId); if (h is null) return NotFound();
                if (p.Title is not null) h.Title = p.Title; if (p.ForE is not null) h.ForE = p.ForE;
                if (p.AgainstE is not null) h.AgainstE = p.AgainstE; if (p.Owner is not null) h.Owner = p.Owner;
                if (p.Status is not null) h.Status = p.Status;
                break;
            case "evidence":
                var e = inc.Evidence.FirstOrDefault(x => x.Id == itemId); if (e is null) return NotFound();
                if (p.Title is not null) e.Title = p.Title; if (p.Note is not null) e.Note = p.Note;
                if (p.Source is not null) e.Source = p.Source; if (p.Ref is not null) e.Ref = p.Ref;
                if (p.Kind is not null) e.Kind = p.Kind; if (p.By is not null) e.By = p.By; if (p.T is not null) e.T = p.T;
                break;
            case "actions":
                var a = inc.Actions.FirstOrDefault(x => x.Id == itemId); if (a is null) return NotFound();
                if (a.Weak) break; // weak (AI-flagged) actions are immutable
                if (p.Desc is not null) a.Desc = p.Desc; if (p.Owner is not null) a.Owner = p.Owner;
                if (p.Due is not null) a.Due = p.Due; if (p.Prio is not null) a.Prio = p.Prio;
                if (p.Status is not null) a.Status = p.Status;
                break;
            default:
                return BadRequest("Unknown collection.");
        }
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpPost("{id}/{collection}/{itemId}/cycle")]
    public async Task<ActionResult<Incident>> CycleChild(string id, string collection, string itemId)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        switch (collection)
        {
            case "timeline":
                var t = inc.Timeline.FirstOrDefault(x => x.Id == itemId); if (t is null) return NotFound();
                t.Type = Next(TimelineTypeOrder, t.Type);
                break;
            case "hypotheses":
                var h = inc.Hypotheses.FirstOrDefault(x => x.Id == itemId); if (h is null) return NotFound();
                h.Status = Next(HypoStatusOrder, h.Status);
                break;
            case "evidence":
                var e = inc.Evidence.FirstOrDefault(x => x.Id == itemId); if (e is null) return NotFound();
                e.Kind = Next(EvidenceKindOrder, e.Kind);
                break;
            case "actions-status":
                var a1 = inc.Actions.FirstOrDefault(x => x.Id == itemId); if (a1 is null) return NotFound();
                if (!a1.Weak) a1.Status = Next(ActionStatusOrder, a1.Status);
                break;
            case "actions-prio":
                var a2 = inc.Actions.FirstOrDefault(x => x.Id == itemId); if (a2 is null) return NotFound();
                if (!a2.Weak) a2.Prio = Next(PrioOrder, a2.Prio);
                break;
            default:
                return BadRequest("Unknown cycle target.");
        }
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    [HttpDelete("{id}/{collection}/{itemId}")]
    public async Task<ActionResult<Incident>> DeleteChild(string id, string collection, string itemId)
    {
        var inc = await Full().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        switch (collection)
        {
            case "timeline": inc.Timeline.RemoveAll(x => x.Id == itemId); break;
            case "hypotheses": inc.Hypotheses.RemoveAll(x => x.Id == itemId); break;
            case "evidence": inc.Evidence.RemoveAll(x => x.Id == itemId); break;
            case "actions": inc.Actions.RemoveAll(x => x.Id == itemId); break;
            default: return BadRequest("Unknown collection.");
        }
        await _db.SaveChangesAsync();
        SortChildren(inc);
        return inc;
    }

    // ---- links ------------------------------------------------------------
    [HttpGet("{id}/links")]
    public async Task<IEnumerable<IncidentLink>> Links(string id) =>
        await _db.IncidentLinks.Where(l => l.IncidentId == id).AsNoTracking().ToListAsync();

    [HttpPost("{id}/links")]
    public async Task<ActionResult<IncidentLink>> AddLink(string id, LinkRequest req)
    {
        var existing = await _db.IncidentLinks.FirstOrDefaultAsync(l => l.IncidentId == id && l.OtherId == req.OtherId);
        if (existing is not null) { existing.Rel = req.Rel ?? existing.Rel; await _db.SaveChangesAsync(); return existing; }
        var link = new IncidentLink { IncidentId = id, OtherId = req.OtherId, Rel = req.Rel ?? "related" };
        _db.IncidentLinks.Add(link);
        await _db.SaveChangesAsync();
        return link;
    }

    [HttpPost("{id}/links/{otherId}/cycle")]
    public async Task<ActionResult<IncidentLink>> CycleLink(string id, string otherId)
    {
        var link = await _db.IncidentLinks.FirstOrDefaultAsync(l => l.IncidentId == id && l.OtherId == otherId);
        if (link is null) return NotFound();
        link.Rel = Next(new[] { "related", "child", "duplicate" }, link.Rel);
        await _db.SaveChangesAsync();
        return link;
    }

    [HttpDelete("{id}/links/{otherId}")]
    public async Task<IActionResult> Unlink(string id, string otherId)
    {
        await _db.IncidentLinks.Where(l => l.IncidentId == id && l.OtherId == otherId).ExecuteDeleteAsync();
        return NoContent();
    }

    // ---- helpers ----------------------------------------------------------
    private static string Next(string[] order, string cur)
    {
        var idx = Array.IndexOf(order, cur);
        return order[(idx + 1 + order.Length) % order.Length];
    }
    private static int NextOrd(IEnumerable<int> xs) => xs.Any() ? xs.Max() + 1 : 0;
    private static int MinOrd(IEnumerable<int> xs) => xs.Any() ? xs.Min() : 0;
    private static string Nid(string p) => p + Guid.NewGuid().ToString("N")[..8];

    private async Task<string> NextIdAsync()
    {
        var ids = await _db.Incidents.Select(i => i.Id).ToListAsync();
        var max = 47;
        foreach (var id in ids)
        {
            var parts = id.Split('-');
            if (parts.Length == 3 && int.TryParse(parts[2], out var n)) max = Math.Max(max, n);
        }
        return $"INC-2026-{(max + 1):D4}";
    }
}
