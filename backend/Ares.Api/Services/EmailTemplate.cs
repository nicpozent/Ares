using Ares.Api.Models;

namespace Ares.Api.Services;

public record EmailDraft(string Subject, string Headline, string Body, Dictionary<string, string> Recips);

/// <summary>
/// Birgma "Global IT Notification" house template. Ported from the prototype's
/// openEmail(): subject suffix logic, Dear colleagues → approved draft → status
/// line → service-desk line → sign-off. Recipient defaults route groups to Bcc.
/// </summary>
public static class EmailTemplate
{
    private const string ServiceDesk = "birgmabiltema.sdpondemand.manageengine.eu";

    private static readonly Dictionary<string, string> ShortTitle = new()
        { ["tech"] = "Technical Update", ["exec"] = "Executive Briefing", ["sd"] = "Service Desk Advisory" };
    private static readonly Dictionary<string, string> Headline = new()
        { ["tech"] = "Technical incident update", ["exec"] = "Executive incident briefing", ["sd"] = "Known issue — customer & store advisory" };

    public static EmailDraft Build(Incident inc, string key)
    {
        var resolved = inc.Status == "Resolved";
        var tag = resolved ? "" : (inc.Sev == "SEV-1" ? " -- ACTION REQUIRED" : " -- FOR AWARENESS");
        var subject = $"Global IT Notification - {(string.IsNullOrWhiteSpace(inc.Title) ? "Incident" : inc.Title)} ({ShortTitle.GetValueOrDefault(key, "Update")}){tag}";

        var draft = key switch
        {
            "tech" => inc.Comms.Tech,
            "exec" => inc.Comms.Exec,
            _ => inc.Comms.Sd
        };

        var nextUpdate = resolved
            ? "This incident is now resolved; no further updates will follow."
            : "The next update will be issued within 60 minutes or as the situation materially changes.";

        var svc = string.IsNullOrWhiteSpace(inc.ServiceName) ? "—" : inc.ServiceName;
        var country = string.IsNullOrWhiteSpace(inc.Country) ? "" : " · " + inc.Country;
        var reference = $"Reference: {inc.Id} · Severity {inc.Sev} · Service {svc}{country}";

        var body =
            "Dear colleagues,\n\n" +
            draft.Body + "\n\n" +
            $"Current status: {inc.Status}. {nextUpdate}\n\n" +
            $"For assistance or to report related impact, please raise a ticket with the IT Service Desk ({ServiceDesk}) and reference {inc.Id}.\n\n" +
            reference + "\n\n" +
            "Kind regards,\nGlobal IT Communications\nBirgma / Biltema";

        // Default recipient routing (group id -> to|bcc). The UI can override.
        var recips = key switch
        {
            "exec" => new Dictionary<string, string> { ["g-lead"] = "to", ["g-store"] = "bcc" },
            "sd" => new Dictionary<string, string> { ["g-store"] = "to", ["g-pay"] = "bcc" },
            _ => new Dictionary<string, string> { ["g-pay"] = "to", ["g-sec"] = "bcc" },
        };

        return new EmailDraft(subject, Headline.GetValueOrDefault(key, "Incident update"), body, recips);
    }
}
