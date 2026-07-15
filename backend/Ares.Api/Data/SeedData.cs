using System.Text.Json;
using Ares.Api.Models;

namespace Ares.Api.Data;

/// <summary>Seeds the anchor scenario (INC-2026-0047 and friends) on first run.</summary>
public static class SeedData
{
    public static async Task EnsureSeededAsync(AresDbContext db)
    {
        if (db.Incidents.Any() || db.Directory.Any()) return;

        db.Directory.AddRange(
            P("u-anna", "Anna Svensson", "anna.svensson@birgma.com", "user", "admin", "ic"),
            P("u-omar", "Omar Haddad", "omar.haddad@birgma.com", "user", "ic", "deputy"),
            P("u-lena", "Lena Berg", "lena.berg@birgma.com", "user", "security", "deputy"),
            P("u-erik", "Erik Nilsson", "erik.nilsson@birgma.com", "user", "tl", "ops", "sme"),
            P("u-maria", "Maria Keller", "maria.keller@birgma.com", "user", "cl", "liaison"),
            P("u-johan", "Johan Lund", "johan.lund@birgma.com", "user", "scribe"),
            P("u-sara", "Sara Pettersson", "sara.pettersson@birgma.com", "user", "owner", "sme"),
            P("u-david", "David Vega", "david.vega@vendor-gateway.com", "user", "vendor"),
            P("g-pay", "Payment Platform Team", "payments@birgma.com", "group", "owner", "responder"),
            P("g-sec", "Security Operations", "secops@birgma.com", "group", "security", "responder"),
            P("g-lead", "Leadership", "leadership@birgma.com", "group", "exec", "viewer"),
            P("g-store", "Store Managers — Sweden", "stores-se@biltema.com", "group", "viewer")
        );

        db.Incidents.Add(Inc47());
        db.Incidents.Add(Inc46());
        db.Incidents.Add(Inc45());

        db.IncidentLinks.Add(new IncidentLink { IncidentId = "INC-2026-0047", OtherId = "INC-2026-0046", Rel = "related" });

        db.Runbooks.AddRange(
            new Runbook { Id = "rb1", Title = "Roll back a bad payment-gateway change", Service = "store-payment-svc", Trigger = "Payment TLS errors after a change", Owner = "Payment Platform", LastRun = "in use now", Steps = new() {
                Step("r1", "Confirm failure onset correlates with a recent change (CHG ID).", true),
                Step("r2", "Verify certificate chain against the gateway trust store.", true),
                Step("r3", "Get IC approval to roll back the change.", true),
                Step("r4", "Execute rollback via Azure DevOps pipeline.", false),
                Step("r5", "Confirm transaction success rate recovers ≥ 95%.", false) } },
            new Runbook { Id = "rb2", Title = "Payment gateway failover", Service = "store-payment-svc", Trigger = "Primary gateway unavailable", Owner = "Payment Platform", LastRun = "Q1 drill", Steps = new() {
                Step("r1", "Declare gateway provider outage & page vendor coordinator.", false),
                Step("r2", "Switch routing to secondary acquirer.", false),
                Step("r3", "Validate test transaction on secondary.", false) } },
            new Runbook { Id = "rb3", Title = "Entra ID sign-in degradation", Service = "entra-id", Trigger = "MFA / sign-in failures spike", Owner = "Security Operations", LastRun = "—", Steps = new() {
                Step("r1", "Check recent Conditional Access policy changes.", false),
                Step("r2", "Review Entra service health & sign-in logs.", false),
                Step("r3", "Roll back offending policy if identified.", false) } }
        );

        db.Slos.AddRange(
            new Slo { Id = "slo1", Service = "store-payment-svc", Objective = "Payment success rate", Target = 99.9, Current = 99.2, BudgetUsed = 82, Window = "30d", Burn = "14×" },
            new Slo { Id = "slo2", Service = "checkout-web", Objective = "Checkout availability", Target = 99.95, Current = 99.94, BudgetUsed = 38, Window = "30d", Burn = "1.1×" },
            new Slo { Id = "slo3", Service = "entra-id", Objective = "Sign-in availability", Target = 99.9, Current = 99.7, BudgetUsed = 61, Window = "30d", Burn = "2.4×" },
            new Slo { Id = "slo4", Service = "erp-core", Objective = "API latency < 500ms", Target = 99.5, Current = 99.8, BudgetUsed = 12, Window = "30d", Burn = "0.3×" }
        );

        db.ReadinessDocs.Add(new ReadinessDoc { Key = "oncall", Json = OncallJson });
        db.ReadinessDocs.Add(new ReadinessDoc { Key = "statusPage", Json = StatusPageJson });

        await db.SaveChangesAsync();
    }

    private static DirectoryPrincipal P(string id, string name, string email, string type, params string[] roles) =>
        new() { Id = id, Name = name, Email = email, Type = type, Roles = roles.ToList() };

    private static RunbookStep Step(string id, string text, bool done) => new() { Id = id, Text = text, Done = done };

    private static Incident Inc47()
    {
        var i = new Incident
        {
            Id = "INC-2026-0047", Title = "Payment failures in Sweden", Sev = "SEV-1", Status = "Investigating",
            Started = "21:43 CET", Duration = "54 min",
            Impact = "38 stores unable to process card payments. Cash payments unaffected.",
            ServiceName = "store-payment-svc", Country = "Sweden",
            Sel = new SeverityDimensions { Business = "Store payments blocked", Geo = "One country", Users = "Customers", Data = "No data impact", Duration = "> 1 hour", Service = "Payment", Regulatory = "PCI DSS" },
            Assign = new() { ["ic"] = "u-anna", ["deputy"] = "u-omar", ["tl"] = "u-erik", ["cl"] = "u-maria", ["scribe"] = "u-johan", ["owner"] = "u-sara", ["security"] = "u-lena", ["vendor"] = "u-david" },
            Comms = new CommsBundle {
                Tech = new CommsDraft { Approved = false, Body = "Increased TLS handshake failures between the store-payment service and the external gateway began three minutes after deployment CHG-18442. The deployment has been rolled back and transaction success rates are recovering." },
                Exec = new CommsDraft { Approved = false, Body = "Card payments were disrupted in 38 Swedish stores; cash payments continued to operate. The suspected change has been reversed and service is recovering. No evidence of data exposure. Next update at 23:15 CET." },
                Sd = new CommsDraft { Approved = false, Body = "Known issue: card payment failures in Swedish stores. Workaround: use the secondary terminal or cash where available. Do not restart payment terminals unless instructed." }
            }
        };
        AddTimeline(i,
            ("t1", "21:39:17", "CHANGE", "Azure DevOps", "CHG-18442 deployment completed — payment-gateway TLS certificate rotation."),
            ("t2", "21:41:06", "ALERT", "Datadog", "TLS handshake failure rate exceeds threshold on store-payment-svc → external gateway."),
            ("t3", "21:42:30", "ALERT", "Sentinel", "Correlated payment decline anomaly detected across 38 Swedish stores."),
            ("t4", "21:43:00", "INCIDENT", "ARES", "SEV-1 declared via Teams /incident. Record + ServiceNow ticket created."),
            ("t5", "21:43:40", "ROSTER", "Graph", "Teams channel + bridge created. IC, Technical Lead, Comms Lead invited and assigned."),
            ("t6", "21:48:12", "MESSAGE", "Teams", "Erik Nilsson: errors line up almost exactly with the cert deploy — checking the chain."),
            ("t7", "21:52:10", "SCRIBE", "AI Scribe", "Failure onset correlated to CHG-18442 (+3m 49s). Hypothesis registered: certificate deployment."),
            ("t8", "22:10:41", "DECISION", "ARES", "IC approved rollback of CHG-18442. Owner: Payment Platform."),
            ("t9", "22:19:50", "CHANGE", "Azure DevOps", "Rollback of CHG-18442 initiated in production."),
            ("t10", "22:37:40", "MILESTONE", "Datadog", "Service recovered — TLS errors return to baseline after rollback."),
            ("t11", "22:41:05", "MILESTONE", "ARES", "Transaction success rate ≥ 96% across all 38 stores. Monitoring for stability."));
        AddHypos(i,
            ("h4", "Certificate deployment CHG-18442 broke the TLS chain", "Failures began +3m after deploy; rollback fully recovered service.", "—", "Payment Platform", "Confirmed"),
            ("h3", "Upstream payment provider outage", "External API latency briefly elevated at onset.", "Provider status page normal; only Swedish stores affected.", "Vendor Coordinator", "Probable"),
            ("h2", "Firewall rule change blocking gateway egress", "A network change was detected at 21:39.", "Only one region affected; change was an unrelated ACL.", "Security Lead", "Investigating"),
            ("h1", "Certificate expired", "TLS handshake failures are consistent with cert issues.", "Certificate remains valid through 2027.", "Network Lead", "Rejected"));
        AddEvidence(i,
            ("e1", "config", "CHG-18442 change record", "Azure DevOps", "CHG-18442", "A. Svensson", "22:02", "Certificate rotation deployment; completed 21:39:17, includes new intermediate CA."),
            ("e2", "metric", "TLS handshake error-rate graph", "Datadog", "dash/pay-tls", "AI Scribe", "21:44", "Error rate steps from 0 to 240/min at 21:41:06, three minutes after the deploy."),
            ("e3", "log", "Gateway handshake failure logs", "store-payment-svc", "log bundle #4471", "E. Nilsson", "22:08", "unknown_ca alerts on outbound TLS to gateway endpoint."),
            ("e4", "screenshot", "POS terminal decline screen — Store 214", "Store manager", "IMG_2231", "M. Keller", "21:55", "Front-line confirmation of card decline; cash unaffected."));
        AddActions(i,
            ("a1", "Add automated certificate-chain validation gate to the deployment pipeline", "Payment Platform", "2026-08-01", "P1", "In progress", false),
            ("a2", "Add synthetic payment transaction monitoring per store cluster", "SRE", "2026-08-15", "P1", "Open", false),
            ("a3", "Require canary deployment by geography for gateway changes", "Release Eng", "2026-08-22", "P2", "Open", false),
            ("a4", "Automatically block non-compliant firewall changes to payment egress", "Security", "2026-09-05", "P2", "Open", false),
            ("a5", "Test payment-gateway failover quarterly", "Payment Platform", "2026-09-30", "P3", "Open", false),
            ("a6", "Monitor certificate deployments more closely", "—", "—", "—", "Rejected", true),
            ("a7", "Remind the team to be careful with production changes", "—", "—", "—", "Rejected", true));
        return i;
    }

    private static Incident Inc46()
    {
        var i = new Incident
        {
            Id = "INC-2026-0046", Title = "Entra ID sign-in failures — Nordic tenant", Sev = "SEV-2", Status = "Investigating",
            Started = "19:12 CET", Duration = "1h 20m",
            Impact = "Intermittent MFA failures delaying staff sign-in across Norway and Sweden.",
            ServiceName = "entra-id", Country = "Norway · Sweden",
            Sel = new SeverityDimensions { Business = "Internal tooling only", Geo = "One country", Users = "Internal users", Data = "No data impact", Duration = "> 1 hour", Service = "Identity", Regulatory = "None" },
            Assign = new() { ["ic"] = "u-omar", ["tl"] = "u-lena", ["cl"] = "u-maria", ["security"] = "u-lena" },
            Comms = new CommsBundle {
                Tech = new CommsDraft { Body = "Sign-in MFA failures under investigation; a recent Conditional Access change is the leading hypothesis." },
                Exec = new CommsDraft { Body = "Some staff are experiencing delayed sign-in in Norway and Sweden. Customer services are unaffected." },
                Sd = new CommsDraft { Body = "Known issue: intermittent MFA prompts failing. Retry after 60 seconds; do not re-register devices." }
            }
        };
        AddTimeline(i,
            ("t1", "19:12:00", "ALERT", "Entra", "Sign-in failure rate elevated for Conditional Access MFA challenge."),
            ("t2", "19:18:20", "INCIDENT", "ARES", "SEV-2 declared. War room opened."),
            ("t3", "19:40:10", "SCRIBE", "AI Scribe", "Correlated to a Conditional Access policy change 15 minutes prior."));
        AddHypos(i,
            ("h1", "Conditional Access policy change", "Failures began after policy publish.", "—", "Security Lead", "Probable"),
            ("h2", "MFA provider latency", "Some timeouts observed.", "Provider healthy.", "Vendor Coordinator", "Investigating"));
        AddEvidence(i,
            ("e1", "config", "Conditional Access policy diff", "Entra", "CA-Policy-Nordic", "L. Berg", "19:44", "Policy scope widened 15 min before onset."));
        return i;
    }

    private static Incident Inc45()
    {
        var i = new Incident
        {
            Id = "INC-2026-0045", Title = "E-commerce checkout latency", Sev = "SEV-3", Status = "Resolved",
            Started = "Mon 14:05 CET", Duration = "2h 05m",
            Impact = "Checkout P95 latency elevated to 4s online; no failed orders.",
            ServiceName = "checkout-web", Country = "Online",
            Sel = new SeverityDimensions { Business = "Degraded checkout", Geo = "Global", Users = "Customers", Data = "No data impact", Duration = "> 1 hour", Service = "E-commerce", Regulatory = "None" },
            Assign = new() { ["ic"] = "u-anna", ["tl"] = "u-erik", ["owner"] = "g-pay" },
            Comms = new CommsBundle {
                Tech = new CommsDraft { Approved = true, Body = "Checkout latency was elevated due to a cache stampede after deploy; resolved by scaling and cache warm-up." },
                Exec = new CommsDraft { Approved = true, Body = "Online checkout was slower than usual for ~2 hours. No orders were lost. Resolved." },
                Sd = new CommsDraft { Approved = true, Body = "Resolved: online checkout speed is back to normal." }
            }
        };
        AddTimeline(i,
            ("t1", "14:05:00", "ALERT", "Datadog", "Checkout P95 latency crosses 3.5s threshold."),
            ("t2", "14:20:00", "DECISION", "ARES", "Scaled checkout service; added cache warm-up."),
            ("t3", "16:10:00", "MILESTONE", "Datadog", "Latency back under 1.5s. Incident resolved."));
        AddHypos(i,
            ("h1", "Cache stampede after deploy", "Latency spiked post-deploy; resolved after warm-up.", "—", "SRE", "Confirmed"));
        AddEvidence(i,
            ("e1", "metric", "Checkout latency P95", "Datadog", "dash/checkout", "AI Scribe", "16:12", "Clear spike-and-recovery aligned to deploy + warm-up."));
        return i;
    }

    private static void AddTimeline(Incident i, params (string id, string t, string type, string src, string text)[] rows)
    {
        int n = 0;
        foreach (var r in rows)
            i.Timeline.Add(new TimelineEvent { Id = r.id, IncidentId = i.Id, T = r.t, Type = r.type, Src = r.src, Text = r.text, Ordinal = n++ });
    }

    private static void AddHypos(Incident i, params (string id, string title, string forE, string againstE, string owner, string status)[] rows)
    {
        int n = 0;
        foreach (var r in rows)
            i.Hypotheses.Add(new Hypothesis { Id = r.id, IncidentId = i.Id, Title = r.title, ForE = r.forE, AgainstE = r.againstE, Owner = r.owner, Status = r.status, Ordinal = n++ });
    }

    private static void AddEvidence(Incident i, params (string id, string kind, string title, string source, string @ref, string by, string t, string note)[] rows)
    {
        int n = 0;
        foreach (var r in rows)
            i.Evidence.Add(new EvidenceItem { Id = r.id, IncidentId = i.Id, Kind = r.kind, Title = r.title, Source = r.source, Ref = r.@ref, By = r.by, T = r.t, Note = r.note, Ordinal = n++ });
    }

    private static void AddActions(Incident i, params (string id, string desc, string owner, string due, string prio, string status, bool weak)[] rows)
    {
        int n = 0;
        foreach (var r in rows)
            i.Actions.Add(new CorrectiveAction { Id = r.id, IncidentId = i.Id, Desc = r.desc, Owner = r.owner, Due = r.due, Prio = r.prio, Status = r.status, Weak = r.weak, Ordinal = n++ });
    }

    private const string OncallJson = """
    {
      "schedules": [
        { "id":"sc-pay","team":"Payment Platform","tz":"CET","rotation":"Weekly · hand-off Mon 09:00","shifts":[
          {"id":"sh1","who":"u-erik","label":"Primary","state":"on"},
          {"id":"sh2","who":"u-sara","label":"Secondary","state":"on"},
          {"id":"sh3","who":"u-omar","label":"Primary (next)","state":"upcoming"} ] },
        { "id":"sc-sec","team":"Security Operations","tz":"CET","rotation":"Daily · 24×7 follow-the-sun","shifts":[
          {"id":"sh4","who":"u-lena","label":"Primary","state":"on"},
          {"id":"sh5","who":"u-omar","label":"Manager on-call","state":"on"} ] }
      ],
      "escalation": [
        { "id":"ep-sev1","name":"SEV-1 · Payment","steps":[
          {"id":"s1","after":"0 min","target":"Primary on-call · Payment","via":"Teams · Push"},
          {"id":"s2","after":"5 min","target":"Secondary on-call · Payment","via":"Push · SMS"},
          {"id":"s3","after":"10 min","target":"Incident Commander","via":"Phone call"},
          {"id":"s4","after":"15 min","target":"Executive Sponsor","via":"Phone call"} ] },
        { "id":"ep-sev2","name":"SEV-2 · Default","steps":[
          {"id":"s1","after":"0 min","target":"Primary on-call","via":"Teams · Push"},
          {"id":"s2","after":"15 min","target":"Team manager","via":"Push · SMS"} ] }
      ],
      "pages": [
        {"id":"pg1","target":"Erik Nilsson · Primary on-call","via":"Teams · Push","state":"Acknowledged","at":"21:41","ackAt":"21:41"},
        {"id":"pg2","target":"Sara Pettersson · Secondary","via":"Push · SMS","state":"Acknowledged","at":"21:46","ackAt":"21:47"},
        {"id":"pg3","target":"Anna Svensson · Incident Commander","via":"Phone call","state":"Paging","at":"21:51","ackAt":null}
      ]
    }
    """;

    private const string StatusPageJson = """
    {
      "published": true,
      "url": "status.birgma.com",
      "components": [
        {"id":"c1","name":"In-store card payments — Sweden","state":"outage"},
        {"id":"c2","name":"In-store card payments — other regions","state":"operational"},
        {"id":"c3","name":"Online checkout","state":"operational"},
        {"id":"c4","name":"Staff sign-in (Entra ID)","state":"degraded"},
        {"id":"c5","name":"Cash & receipts","state":"operational"}
      ],
      "updates": [
        {"id":"su1","t":"22:05 CET","state":"identified","title":"Card payments disrupted in Sweden","body":"We identified a change affecting card payments in Swedish stores and are rolling it back. Cash payments are unaffected."},
        {"id":"su2","t":"21:50 CET","state":"investigating","title":"Investigating card payment failures","body":"We are investigating reports of card payment failures in some Swedish stores."}
      ]
    }
    """;
}
