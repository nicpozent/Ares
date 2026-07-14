import { getApiToken } from '../auth/msal'
import type {
  AppConfig, DirectoryPrincipal, EmailDraft, GraphApp, GraphGroup, GraphPrincipal,
  Incident, IncidentLink, RoleDef, Runbook, SeverityDimensions, Slo,
} from '../types'

const BASE = import.meta.env.VITE_API_BASE || '/api'

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getApiToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as any) }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    let detail = ''
    try { detail = JSON.stringify(await res.json()) } catch { detail = await res.text().catch(() => '') }
    throw new Error(`API ${res.status} ${path}: ${detail}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

const body = (v: unknown) => JSON.stringify(v)

export const api = {
  // meta
  config: () => req<AppConfig>('/meta/config'),
  roles: () => req<RoleDef[]>('/meta/roles'),

  // incidents
  incidents: () => req<Incident[]>('/incidents'),
  incident: (id: string) => req<Incident>(`/incidents/${id}`),
  declare: (d: { title: string; impact: string; serviceName: string; country: string; sel: SeverityDimensions; status?: string }) =>
    req<Incident>('/incidents', { method: 'POST', body: body(d) }),
  editIncident: (id: string, d: { title: string; impact: string; serviceName: string; country: string; sel: SeverityDimensions; status?: string }) =>
    req<Incident>(`/incidents/${id}`, { method: 'PUT', body: body(d) }),
  patchIncident: (id: string, p: { impact?: string; status?: string; title?: string; duration?: string }) =>
    req<Incident>(`/incidents/${id}`, { method: 'PATCH', body: body(p) }),
  deleteIncident: (id: string) => req<void>(`/incidents/${id}`, { method: 'DELETE' }),
  resolveIncident: (id: string) => req<Incident>(`/incidents/${id}/resolve`, { method: 'POST' }),
  assign: (id: string, slot: string, userId: string | null) =>
    req<Incident>(`/incidents/${id}/assign/${slot}`, { method: 'PUT', body: body({ userId }) }),

  // comms
  editComms: (id: string, key: string, text: string) =>
    req<Incident>(`/incidents/${id}/comms/${key}`, { method: 'PUT', body: body({ body: text }) }),
  approveComms: (id: string, key: string) =>
    req<Incident>(`/incidents/${id}/comms/${key}/approve`, { method: 'POST' }),

  // children (timeline | hypotheses | evidence | actions)
  addChild: (id: string, coll: string) => req<Incident>(`/incidents/${id}/${coll}`, { method: 'POST' }),
  patchChild: (id: string, coll: string, itemId: string, patch: Record<string, string>) =>
    req<Incident>(`/incidents/${id}/${coll}/${itemId}`, { method: 'PUT', body: body(patch) }),
  cycleChild: (id: string, coll: string, itemId: string) =>
    req<Incident>(`/incidents/${id}/${coll}/${itemId}/cycle`, { method: 'POST' }),
  deleteChild: (id: string, coll: string, itemId: string) =>
    req<Incident>(`/incidents/${id}/${coll}/${itemId}`, { method: 'DELETE' }),

  // links
  links: (id: string) => req<IncidentLink[]>(`/incidents/${id}/links`),
  addLink: (id: string, otherId: string, rel = 'related') =>
    req<IncidentLink>(`/incidents/${id}/links`, { method: 'POST', body: body({ otherId, rel }) }),
  cycleLink: (id: string, otherId: string) =>
    req<IncidentLink>(`/incidents/${id}/links/${otherId}/cycle`, { method: 'POST' }),
  unlink: (id: string, otherId: string) =>
    req<void>(`/incidents/${id}/links/${otherId}`, { method: 'DELETE' }),

  // directory / admin
  directory: () => req<DirectoryPrincipal[]>('/directory'),
  addPrincipal: (p: { name: string; email: string; type: string; roles: string[] }) =>
    req<DirectoryPrincipal>('/directory', { method: 'POST', body: body(p) }),
  deletePrincipal: (id: string) => req<void>(`/directory/${id}`, { method: 'DELETE' }),
  toggleRole: (id: string, roleKey: string) =>
    req<DirectoryPrincipal>(`/directory/${id}/roles/${roleKey}/toggle`, { method: 'POST' }),

  // Entra import
  entraStatus: () => req<{ configured: boolean }>('/admin/entra/status'),
  entraGroups: (query?: string) => req<GraphGroup[]>(`/admin/entra/groups${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  entraGroupMembers: (id: string) => req<GraphPrincipal[]>(`/admin/entra/groups/${id}/members`),
  entraApps: (query?: string) => req<GraphApp[]>(`/admin/entra/apps${query ? `?query=${encodeURIComponent(query)}` : ''}`),
  entraAppAssignments: (id: string) => req<GraphPrincipal[]>(`/admin/entra/apps/${id}/assignments`),
  entraImport: (principals: { entraId: string; name: string; email: string; type: string; source?: string; roles?: string[] }[]) =>
    req<{ added: number; updated: number; total: number }>('/admin/entra/import', { method: 'POST', body: body({ principals }) }),

  // email
  emailDraft: (id: string, key: string) => req<EmailDraft>(`/incidents/${id}/comms/${key}/email-draft`),
  sendEmail: (payload: { incidentId: string; key: string; subject: string; body: string; recips: Record<string, string> }) =>
    req<{ sent: boolean; graphConfigured: boolean; to: string[]; bccCount: number; note: string }>('/email/send', { method: 'POST', body: body(payload) }),

  // readiness
  readinessDoc: <T>(key: string) => req<T>(`/readiness/${key}`),
  putReadinessDoc: (key: string, doc: unknown) => req<void>(`/readiness/${key}`, { method: 'PUT', body: body(doc) }),
  runbooks: () => req<Runbook[]>('/runbooks'),
  updateRunbook: (rb: Runbook) => req<Runbook>(`/runbooks/${rb.id}`, { method: 'PUT', body: body(rb) }),
  attachRunbook: (id: string, incidentId: string) => req<void>(`/runbooks/${id}/attach/${incidentId}`, { method: 'POST' }),
  slos: () => req<Slo[]>('/slos'),
}
