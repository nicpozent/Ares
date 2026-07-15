using Ares.Api.Data;
using Ares.Api.Dtos;
using Ares.Api.Models;
using Ares.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;

namespace Ares.Api.Controllers;

[ApiController]
[Route("api")]
public class EmailController : ControllerBase
{
    private readonly AresDbContext _db;
    private readonly GraphService _graph;
    private readonly MailOptions _mail;
    private readonly ILogger<EmailController> _log;

    public EmailController(AresDbContext db, GraphService graph, IOptions<MailOptions> mail, ILogger<EmailController> log)
    { _db = db; _graph = graph; _mail = mail.Value; _log = log; }

    /// <summary>Compose the Birgma house-style draft for an audience (server-authoritative template).</summary>
    [HttpGet("incidents/{id}/comms/{key}/email-draft")]
    public async Task<ActionResult<EmailDraft>> Draft(string id, string key)
    {
        var inc = await _db.Incidents.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (inc is null) return NotFound();
        if (key is not ("tech" or "exec" or "sd")) return BadRequest("Unknown audience key.");
        return EmailTemplate.Build(inc, key);
    }

    /// <summary>Release a notification via Microsoft Graph (shared mailbox, application permissions).</summary>
    [HttpPost("email/send")]
    public async Task<ActionResult<object>> Send(SendEmailRequest req, CancellationToken ct)
    {
        var inc = await _db.Incidents
            .Include(i => i.Timeline)
            .FirstOrDefaultAsync(i => i.Id == req.IncidentId, ct);
        if (inc is null) return NotFound();

        // Resolve recipient principal ids -> email addresses.
        var ids = req.Recips.Keys.ToList();
        var principals = await _db.Directory.Where(d => ids.Contains(d.Id)).AsNoTracking().ToListAsync(ct);
        var byId = principals.ToDictionary(p => p.Id, p => p);

        var to = new List<string>();
        var bcc = new List<string>();
        var toNames = new List<string>();
        foreach (var (pid, mode) in req.Recips)
        {
            if (!byId.TryGetValue(pid, out var p) || string.IsNullOrWhiteSpace(p.Email)) continue;
            if (mode == "to") { to.Add(p.Email); toNames.Add(p.Name); }
            else bcc.Add(p.Email);
        }

        var sent = false;
        string note;
        if (_graph.IsConfigured)
        {
            try
            {
                await _graph.SendMailAsync(_mail.Sender, req.Subject, req.Body, to, bcc, _mail.SaveToSentItems, ct);
                sent = true;
                note = $"Release email “{req.Subject}” sent via Graph — To: {(toNames.Count > 0 ? string.Join(", ", toNames) : "—")}; Bcc: {bcc.Count} recipient list(s).";
            }
            catch (Exception ex)
            {
                _log.LogError(ex, "Graph sendMail failed.");
                return StatusCode(StatusCodes.Status502BadGateway, new { error = "Send failed: " + ex.Message });
            }
        }
        else
        {
            // Pilot/demo mode: record the release without a real send.
            note = $"Release email “{req.Subject}” prepared (Graph not configured — not dispatched) — To: {(toNames.Count > 0 ? string.Join(", ", toNames) : "—")}; Bcc: {bcc.Count} recipient list(s).";
        }

        // Mark the audience draft approved + log to the timeline.
        var draft = req.Key switch { "tech" => inc.Comms.Tech, "exec" => inc.Comms.Exec, "sd" => inc.Comms.Sd, _ => null };
        if (draft is not null)
        {
            draft.Approved = true;
            _db.Entry(inc).Property(x => x.Comms).IsModified = true;
        }
        var ord = inc.Timeline.Count == 0 ? 0 : inc.Timeline.Max(t => t.Ordinal) + 1;
        inc.Timeline.Add(new TimelineEvent
        {
            Id = "t" + Guid.NewGuid().ToString("N")[..8], IncidentId = inc.Id,
            T = DateTime.UtcNow.ToString("HH:mm:ss"), Type = "MESSAGE", Src = "Email", Text = note, Ordinal = ord
        });
        await _db.SaveChangesAsync(ct);

        return new { sent, graphConfigured = _graph.IsConfigured, to = toNames, bccCount = bcc.Count, note };
    }
}
