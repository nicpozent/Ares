using Ares.Api.Models;

namespace Ares.Api.Services;

public record SeverityResult(string Level, string Reason);

/// <summary>
/// Deterministic severity classification. Ported verbatim from the prototype's
/// <c>computeSev</c> — severity is rule-computed, never model-inferred. Keep this
/// in lockstep with the frontend <c>computeSev</c> in src/lib/severity.ts.
/// </summary>
public static class SeverityEngine
{
    private static readonly HashSet<string> Critical = new(StringComparer.Ordinal)
        { "Payment", "Identity", "ERP", "E-commerce" };

    public static SeverityResult Compute(SeverityDimensions sel)
    {
        var critical = Critical.Contains(sel.Service);
        var customer = sel.Users == "Customers";

        if (sel.Data == "Confirmed exposure")
            return new("SEV-1", "Confirmed data exposure forces the highest severity regardless of other dimensions.");

        if (critical && customer && sel.Business == "Store payments blocked")
            return new("SEV-1", "Customer-facing payment service fully blocked — a critical revenue path. Auto-classified SEV-1; PCI DSS notification path engaged.");

        if (critical && customer)
            return new("SEV-2", "A critical customer-facing service is degraded but not fully blocked. Classified SEV-2.");

        if (critical)
            return new("SEV-2", "A critical service is affected without confirmed customer impact. Classified SEV-2.");

        if (sel.Data == "Exposure suspected")
            return new("SEV-2", "Suspected data exposure escalates to SEV-2 pending security review.");

        return new("SEV-3", "No critical service or customer impact detected. Classified SEV-3 for standard handling.");
    }
}
