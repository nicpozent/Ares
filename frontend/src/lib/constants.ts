// UI constants ported from the prototype.

export const ROSTER_SLOTS = ['ic', 'deputy', 'tl', 'cl', 'scribe', 'owner', 'security', 'vendor']

export const EVIDENCE_KINDS = [
  { k: 'log', label: 'LOG', glyph: '≣', c: '#8a63d2' },
  { k: 'metric', label: 'METRIC', glyph: '◔', c: '#2E93E6' },
  { k: 'screenshot', label: 'SCREEN', glyph: '▤', c: '#37d39b' },
  { k: 'config', label: 'CONFIG', glyph: '⚙', c: '#ffb020' },
  { k: 'link', label: 'LINK', glyph: '↗', c: '#6c7fb0' },
  { k: 'file', label: 'FILE', glyph: '▢', c: '#ff3d6e' },
]

export const TYPE_COLORS: Record<string, string> = {
  CHANGE: '#8a63d2', ALERT: '#ff3d6e', INCIDENT: '#2E93E6', ROSTER: '#2E93E6',
  MESSAGE: '#6c7fb0', SCRIBE: '#37d39b', DECISION: '#ffb020', MILESTONE: '#37d39b',
}

export const HYPO_STYLE: Record<string, [string, string]> = {
  Confirmed: ['#37d39b', 'rgba(55,211,155,.14)'],
  Probable: ['#ffb020', 'rgba(255,176,32,.14)'],
  Investigating: ['#2E93E6', 'rgba(46,147,230,.14)'],
  Rejected: ['#8a97b8', 'rgba(138,151,184,.14)'],
  Suggested: ['#a78bfa', 'rgba(167,139,250,.14)'],
}

export const DECLARE_DIMS = [
  { key: 'business', tag: '01', label: 'Business impact', opts: ['Store payments blocked', 'Degraded checkout', 'Internal tooling only'] },
  { key: 'geo', tag: '02', label: 'Geographic impact', opts: ['One store', 'One country', 'Global'] },
  { key: 'users', tag: '03', label: 'User impact', opts: ['Internal users', 'Customers', 'Suppliers'] },
  { key: 'data', tag: '04', label: 'Data impact', opts: ['No data impact', 'Exposure suspected', 'Confirmed exposure'] },
  { key: 'duration', tag: '05', label: 'Duration', opts: ['< 15 min', '15–60 min', '> 1 hour'] },
  { key: 'service', tag: '06', label: 'Critical service', opts: ['Payment', 'Identity', 'ERP', 'E-commerce', 'None'] },
  { key: 'regulatory', tag: '07', label: 'Regulatory impact', opts: ['None', 'PCI DSS', 'GDPR', 'Contractual'] },
] as const

export function initials(s: string): string {
  return (s || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}
