import type { SeverityDimensions, Sev } from '../types'

// Deterministic severity — MUST stay in lockstep with the backend
// SeverityEngine.Compute (Services/SeverityEngine.cs). Rule-computed, never AI.
export function computeSev(sel: SeverityDimensions): { level: Sev; reason: string } {
  const critical = ['Payment', 'Identity', 'ERP', 'E-commerce'].includes(sel.service)
  const customer = sel.users === 'Customers'

  if (sel.data === 'Confirmed exposure')
    return { level: 'SEV-1', reason: 'Confirmed data exposure forces the highest severity regardless of other dimensions.' }
  if (critical && customer && sel.business === 'Store payments blocked')
    return { level: 'SEV-1', reason: 'Customer-facing payment service fully blocked — a critical revenue path. Auto-classified SEV-1; PCI DSS notification path engaged.' }
  if (critical && customer)
    return { level: 'SEV-2', reason: 'A critical customer-facing service is degraded but not fully blocked. Classified SEV-2.' }
  if (critical)
    return { level: 'SEV-2', reason: 'A critical service is affected without confirmed customer impact. Classified SEV-2.' }
  if (sel.data === 'Exposure suspected')
    return { level: 'SEV-2', reason: 'Suspected data exposure escalates to SEV-2 pending security review.' }
  return { level: 'SEV-3', reason: 'No critical service or customer impact detected. Classified SEV-3 for standard handling.' }
}

export function sevBg(level: string): string {
  return (
    {
      'SEV-1': 'linear-gradient(135deg,#DE0A45,#ff6a3d)',
      'SEV-2': 'linear-gradient(135deg,#c77700,#ffb020)',
      'SEV-3': 'linear-gradient(135deg,#3358d4,#2E93E6)',
    } as Record<string, string>
  )[level] ?? 'var(--grad)'
}

export function statusColor(st: string): string {
  return st === 'Resolved' ? 'var(--ok)' : st === 'Monitoring' ? 'var(--brandA)' : 'var(--accent)'
}
