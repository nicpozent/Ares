using System.Text.Json;
using Ares.Api.Models;

namespace Ares.Api.Services;

/// <summary>
/// Builds the War Room Adaptive Card (schema 1.4) for an incident, mirroring the
/// prototype's Teams Adaptive Card. Returned as a JSON string for a Graph
/// chatMessage attachment (contentType application/vnd.microsoft.card.adaptive).
/// </summary>
public static class AdaptiveCardBuilder
{
    private static readonly Dictionary<string, string> SevColor = new()
        { ["SEV-1"] = "attention", ["SEV-2"] = "warning", ["SEV-3"] = "accent" };

    public static string Build(Incident inc, Func<string, string?> resolveName)
    {
        string color = SevColor.GetValueOrDefault(inc.Sev, "default");

        var roleLines = new List<object>();
        foreach (var (slot, uid) in inc.Assign)
        {
            if (string.IsNullOrWhiteSpace(uid)) continue;
            var name = resolveName(uid!) ?? uid!;
            roleLines.Add(new { title = RolesCatalogue.All.FirstOrDefault(r => r.Key == slot)?.Label ?? slot, value = name });
        }

        var topH = inc.Hypotheses.FirstOrDefault(h => h.Status == "Confirmed")
                   ?? inc.Hypotheses.FirstOrDefault(h => h.Status == "Probable")
                   ?? inc.Hypotheses.FirstOrDefault();

        var body = new List<object>
        {
            new { type = "TextBlock", text = $"{inc.Sev} · {inc.Id}", weight = "bolder", color, size = "medium", spacing = "none" },
            new { type = "TextBlock", text = inc.Title, weight = "bolder", size = "large", wrap = true, spacing = "none" },
            new { type = "FactSet", facts = new object[]
                {
                    new { title = "Status", value = inc.Status },
                    new { title = "Started", value = inc.Started },
                    new { title = "Duration", value = inc.Duration },
                    new { title = "Service", value = string.IsNullOrWhiteSpace(inc.ServiceName) ? "—" : inc.ServiceName },
                    new { title = "Country", value = string.IsNullOrWhiteSpace(inc.Country) ? "—" : inc.Country },
                } },
            new { type = "TextBlock", text = "**Impact**", weight = "bolder", spacing = "medium", wrap = true },
            new { type = "TextBlock", text = string.IsNullOrWhiteSpace(inc.Impact) ? "—" : inc.Impact, wrap = true, spacing = "none" },
        };

        if (topH is not null)
        {
            body.Add(new { type = "TextBlock", text = $"**Current hypothesis · {topH.Status}**", weight = "bolder", spacing = "medium", wrap = true });
            body.Add(new { type = "TextBlock", text = topH.Title, wrap = true, spacing = "none" });
        }
        if (roleLines.Count > 0)
        {
            body.Add(new { type = "TextBlock", text = "**Incident roles**", weight = "bolder", spacing = "medium", wrap = true });
            body.Add(new { type = "FactSet", facts = roleLines });
        }

        var card = new
        {
            type = "AdaptiveCard",
            schema = "http://adaptivecards.io/schemas/adaptive-card.json",
            version = "1.4",
            body,
        };

        // Emit with the "$schema" key AdaptiveCards expects.
        var json = JsonSerializer.Serialize(card);
        return json.Replace("\"schema\":", "\"$schema\":");
    }
}
