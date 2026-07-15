namespace Ares.Api.Services;

public record RoleDef(string Key, string Label, string Kind, string Glyph, string Desc);

/// <summary>Canonical ARES role catalogue (platform + incident roles).</summary>
public static class RolesCatalogue
{
    public static readonly IReadOnlyList<RoleDef> All = new List<RoleDef>
    {
        new("admin",     "Administrator",         "platform", "◆", "Full platform configuration, Entra role mapping and security settings."),
        new("ic",        "Incident Commander",    "incident", "★", "Owns coordination and decision-making for the incident."),
        new("deputy",    "Deputy Commander",      "incident", "☆", "Backs up and relieves the Incident Commander."),
        new("tl",        "Technical Lead",        "incident", "⚙", "Directs technical investigation and remediation."),
        new("ops",       "Operations Lead",       "incident", "▤", "Coordinates hands-on operational execution."),
        new("cl",        "Communications Lead",   "incident", "✉", "Owns stakeholder and customer communications."),
        new("scribe",    "Scribe",                "incident", "≡", "Records events, decisions and actions (AI-assisted)."),
        new("owner",     "Service Owner",         "incident", "◈", "Represents and validates the affected service."),
        new("sme",       "Subject-Matter Expert", "incident", "✦", "Deep expertise on the affected domain."),
        new("security",  "Security Lead",         "incident", "⛉", "Engaged whenever a cyber incident is suspected."),
        new("liaison",   "Customer Liaison",      "incident", "☎", "Front-line and customer-impact representation."),
        new("exec",      "Executive Sponsor",     "incident", "♛", "Business accountability and escalation authority."),
        new("vendor",    "Vendor Coordinator",    "incident", "⇄", "Manages external providers and vendor bridges."),
        new("responder", "Responder",             "platform", "●", "Can join incidents and edit incident data."),
        new("viewer",    "Stakeholder",           "platform", "○", "Read-only visibility for stakeholders."),
    };
}
