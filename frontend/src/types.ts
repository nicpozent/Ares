// Mirrors the ASP.NET Core API (camelCase JSON).

export type Sev = 'SEV-1' | 'SEV-2' | 'SEV-3'
export type ThemeId = 'command' | 'daylight' | 'carbon'

export interface SeverityDimensions {
  business: string
  geo: string
  users: string
  data: string
  duration: string
  service: string
  regulatory: string
}

export interface CommsDraft { approved: boolean; body: string }
export interface CommsBundle { tech: CommsDraft; exec: CommsDraft; sd: CommsDraft }

export interface TimelineEvent { id: string; t: string; type: string; src: string; text: string; ordinal: number }
export interface Hypothesis { id: string; title: string; forE: string; againstE: string; owner: string; status: string; ordinal: number }
export interface EvidenceItem { id: string; kind: string; title: string; source: string; ref: string; by: string; t: string; note: string; ordinal: number }
export interface CorrectiveAction { id: string; desc: string; owner: string; due: string; prio: string; status: string; weak: boolean; ordinal: number }

export interface Incident {
  id: string
  title: string
  sev: Sev
  status: string
  started: string
  duration: string
  impact: string
  serviceName: string
  country: string
  sel: SeverityDimensions
  assign: Record<string, string | null>
  comms: CommsBundle
  timeline: TimelineEvent[]
  hypotheses: Hypothesis[]
  evidence: EvidenceItem[]
  actions: CorrectiveAction[]
}

export interface DirectoryPrincipal {
  id: string
  name: string
  email: string
  type: 'user' | 'group'
  roles: string[]
  entraId?: string | null
  entraSource?: string | null
}

export interface RoleDef { key: string; label: string; kind: 'platform' | 'incident'; glyph: string; desc: string }
export interface IncidentLink { id: number; incidentId: string; otherId: string; rel: string }

export interface EmailDraft { subject: string; headline: string; body: string; recips: Record<string, string> }

export interface Runbook {
  id: string; title: string; service: string; trigger: string; owner: string; lastRun: string
  steps: { id: string; text: string; done: boolean }[]
}
export interface Slo {
  id: string; service: string; objective: string; target: number; current: number
  budgetUsed: number; window: string; burn: string
}

// Entra import DTOs
export interface GraphGroup { id: string; displayName: string; mail?: string | null; description?: string | null; memberCount?: number | null }
export interface GraphApp { id: string; displayName: string; appId?: string | null }
export interface GraphPrincipal { entraId: string; name: string; email: string; type: string }

export interface AppConfig { entraConfigured: boolean; mailSender: string; demoAuth: boolean }
