using System.Text.Json.Serialization;

namespace Ares.Api.Models;

// ---------------------------------------------------------------------------
// Core incident aggregate. Children (timeline, hypotheses, evidence, actions)
// are relational rows; the tightly-coupled value objects (severity dimensions,
// role assignment, comms drafts) live in jsonb columns.
// ---------------------------------------------------------------------------
public class Incident
{
    public string Id { get; set; } = default!;            // e.g. INC-2026-0047
    public string Title { get; set; } = "";
    public string Sev { get; set; } = "SEV-3";            // SEV-1 | SEV-2 | SEV-3
    public string Status { get; set; } = "Investigating"; // Investigating | Monitoring | Resolved
    public string Started { get; set; } = "";
    public string Duration { get; set; } = "0 min";
    public string Impact { get; set; } = "";
    public string ServiceName { get; set; } = "";
    public string Country { get; set; } = "";

    public SeverityDimensions Sel { get; set; } = new();
    public Dictionary<string, string?> Assign { get; set; } = new();
    public CommsBundle Comms { get; set; } = new();

    // Microsoft Teams war-room channel (populated when provisioned via Graph).
    public string? TeamsChannelId { get; set; }
    public string? TeamsChannelUrl { get; set; }

    public List<TimelineEvent> Timeline { get; set; } = new();
    public List<Hypothesis> Hypotheses { get; set; } = new();
    public List<EvidenceItem> Evidence { get; set; } = new();
    public List<CorrectiveAction> Actions { get; set; } = new();
}

public class SeverityDimensions
{
    public string Business { get; set; } = "Internal tooling only";
    public string Geo { get; set; } = "One store";
    public string Users { get; set; } = "Internal users";
    public string Data { get; set; } = "No data impact";
    public string Duration { get; set; } = "< 15 min";
    public string Service { get; set; } = "None";
    public string Regulatory { get; set; } = "None";
}

public class CommsBundle
{
    public CommsDraft Tech { get; set; } = new();
    public CommsDraft Exec { get; set; } = new();
    public CommsDraft Sd { get; set; } = new();
}

public class CommsDraft
{
    public bool Approved { get; set; }
    public string Body { get; set; } = "";
}

public class TimelineEvent
{
    public string Id { get; set; } = default!;
    public string IncidentId { get; set; } = default!;
    [JsonIgnore] public Incident? Incident { get; set; }
    public string T { get; set; } = "";      // HH:mm:ss
    public string Type { get; set; } = "MESSAGE";
    public string Src { get; set; } = "";
    public string Text { get; set; } = "";
    public int Ordinal { get; set; }
}

public class Hypothesis
{
    public string Id { get; set; } = default!;
    public string IncidentId { get; set; } = default!;
    [JsonIgnore] public Incident? Incident { get; set; }
    public string Title { get; set; } = "";
    public string ForE { get; set; } = "—";
    public string AgainstE { get; set; } = "—";
    public string Owner { get; set; } = "Unassigned";
    public string Status { get; set; } = "Suggested";
    public int Ordinal { get; set; }
}

public class EvidenceItem
{
    public string Id { get; set; } = default!;
    public string IncidentId { get; set; } = default!;
    [JsonIgnore] public Incident? Incident { get; set; }
    public string Kind { get; set; } = "log";
    public string Title { get; set; } = "";
    public string Source { get; set; } = "";
    public string Ref { get; set; } = "";
    public string By { get; set; } = "";
    public string T { get; set; } = "";
    public string Note { get; set; } = "";
    public int Ordinal { get; set; }
}

public class CorrectiveAction
{
    public string Id { get; set; } = default!;
    public string IncidentId { get; set; } = default!;
    [JsonIgnore] public Incident? Incident { get; set; }
    public string Desc { get; set; } = "";
    public string Owner { get; set; } = "Unassigned";
    public string Due { get; set; } = "TBD";
    public string Prio { get; set; } = "P2";
    public string Status { get; set; } = "Open";
    public bool Weak { get; set; }
    public int Ordinal { get; set; }
}

// ---------------------------------------------------------------------------
// Directory principal — Entra user or group mapped to ARES roles.
// EntraId/EntraType are populated when imported via Microsoft Graph.
// ---------------------------------------------------------------------------
public class DirectoryPrincipal
{
    public string Id { get; set; } = default!;       // internal id (u-... / g-...) or Entra object id
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Type { get; set; } = "user";       // user | group
    public List<string> Roles { get; set; } = new(); // ARES role keys
    public string? EntraId { get; set; }             // Entra object id, when imported
    public string? EntraSource { get; set; }         // group name / enterprise-app name it came from
}

// ---------------------------------------------------------------------------
// Incident relationships (related / child / duplicate).
// ---------------------------------------------------------------------------
public class IncidentLink
{
    public int Id { get; set; }
    public string IncidentId { get; set; } = default!; // owning incident
    public string OtherId { get; set; } = default!;    // linked incident
    public string Rel { get; set; } = "related";       // related | child | duplicate
}

// ---------------------------------------------------------------------------
// Readiness surfaces — stored as jsonb documents keyed by a stable name.
// Keeps the pilot simple; can be normalised later without API changes.
// ---------------------------------------------------------------------------
public class ReadinessDoc
{
    public string Key { get; set; } = default!;  // oncall | statusPage
    public string Json { get; set; } = "{}";
}

public class Runbook
{
    public string Id { get; set; } = default!;
    public string Title { get; set; } = "";
    public string Service { get; set; } = "";
    public string Trigger { get; set; } = "";
    public string Owner { get; set; } = "";
    public string LastRun { get; set; } = "—";
    public List<RunbookStep> Steps { get; set; } = new();
}

public class RunbookStep
{
    public string Id { get; set; } = default!;
    public string Text { get; set; } = "";
    public bool Done { get; set; }
}

public class Slo
{
    public string Id { get; set; } = default!;
    public string Service { get; set; } = "";
    public string Objective { get; set; } = "";
    public double Target { get; set; }
    public double Current { get; set; }
    public int BudgetUsed { get; set; }
    public string Window { get; set; } = "30d";
    public string Burn { get; set; } = "1x";
}
