import { create } from 'zustand'
import { api } from './api/client'
import { computeSev } from './lib/severity'
import type {
  AppConfig, DirectoryPrincipal, EmailDraft, Incident, IncidentLink,
  RoleDef, Runbook, SeverityDimensions, Slo,
} from './types'

// ---- readiness doc shapes -------------------------------------------------
export interface Shift { id: string; who: string; label: string; state: string }
export interface Schedule { id: string; team: string; tz: string; rotation: string; shifts: Shift[] }
export interface EscStep { id: string; after: string; target: string; via: string }
export interface EscalationPolicy { id: string; name: string; steps: EscStep[] }
export interface Page { id: string; target: string; via: string; state: string; at: string; ackAt: string | null }
export interface OncallDoc { schedules: Schedule[]; escalation: EscalationPolicy[]; pages: Page[] }
export interface StatusComponent { id: string; name: string; state: string }
export interface StatusUpdate { id: string; t: string; state: string; title: string; body: string }
export interface StatusPageDoc { published: boolean; url: string; components: StatusComponent[]; updates: StatusUpdate[] }

export type View =
  | 'incidents' | 'warroom' | 'declare' | 'timeline' | 'hypotheses' | 'evidence'
  | 'comms' | 'rca' | 'actions' | 'analytics' | 'platform'
  | 'oncall' | 'runbooks' | 'status' | 'slo' | 'admin'

export type ThemeId = 'command' | 'daylight' | 'carbon'
type Modal = 'assign' | 'email' | 'delete' | 'import' | null

interface DraftIncident {
  id: string; title: string; sev: string; status: string; started: string; duration: string
  impact: string; serviceName: string; country: string; sel: SeverityDimensions
}

interface State {
  ready: boolean
  config: AppConfig | null
  roles: RoleDef[]
  theme: ThemeId
  view: View
  isAdmin: boolean

  incidents: Incident[]
  activeId: string | null
  directory: DirectoryPrincipal[]
  links: IncidentLink[]

  oncall: OncallDoc | null
  statusPage: StatusPageDoc | null
  runbooks: Runbook[]
  slos: Slo[]

  // ui
  modal: Modal
  assignSlot: string | null
  deleteId: string | null
  emailKey: string | null
  emailDraft: EmailDraft | null
  lastEmail: string | null
  draft: DraftIncident | null
  draftMode: 'create' | 'edit' | null
  busy: boolean
  error: string | null

  // actions
  init: () => Promise<void>
  setView: (v: View) => void
  setTheme: (t: ThemeId) => void
  toggleAdmin: () => void
  closeModal: () => void

  active: () => Incident | null
  selectIncident: (id: string) => void
  replace: (inc: Incident) => void

  patchImpact: (v: string) => Promise<void>
  resolveActive: () => Promise<void>
  assign: (slot: string, userId: string | null) => Promise<void>
  openAssign: (slot: string) => void

  editComms: (key: string, text: string) => Promise<void>
  approveComms: (key: string) => Promise<void>

  addChild: (coll: string) => Promise<void>
  patchChild: (coll: string, itemId: string, patch: Record<string, string>) => Promise<void>
  cycleChild: (coll: string, itemId: string) => Promise<void>
  deleteChild: (coll: string, itemId: string) => Promise<void>

  loadLinks: () => Promise<void>
  addLink: (otherId: string) => Promise<void>
  cycleLink: (otherId: string) => Promise<void>
  unlink: (otherId: string) => Promise<void>

  // directory / admin
  reloadDirectory: () => Promise<void>
  toggleRole: (id: string, roleKey: string) => Promise<void>
  addPrincipal: (p: { name: string; email: string; type: string; roles: string[] }) => Promise<void>
  deletePrincipal: (id: string) => Promise<void>
  openImport: () => void

  // declare draft
  newIncident: () => void
  newIncidentFromDraft: (d: Partial<DraftIncident>) => void
  editIncident: (id: string) => void
  setDraft: (f: keyof DraftIncident, v: string) => void
  setDraftDim: (k: keyof SeverityDimensions, v: string) => void
  saveDraft: () => Promise<void>
  cancelDraft: () => void
  askDelete: (id: string) => void
  confirmDelete: () => Promise<void>

  // email
  openEmail: (key: string) => Promise<void>
  setEmailField: (f: 'subject' | 'body', v: string) => void
  setRecip: (id: string, mode: 'to' | 'bcc') => void
  sendEmail: () => Promise<void>

  // readiness
  loadReadiness: () => Promise<void>
  saveOncall: (doc: OncallDoc) => Promise<void>
  saveStatusPage: (doc: StatusPageDoc) => Promise<void>
  saveRunbook: (rb: Runbook) => Promise<void>
  attachRunbook: (id: string) => Promise<void>
}

async function guard<T>(set: any, fn: () => Promise<T>): Promise<T | undefined> {
  set({ busy: true, error: null })
  try { return await fn() }
  catch (e: any) { set({ error: e?.message ?? String(e) }); return undefined }
  finally { set({ busy: false }) }
}

export const useStore = create<State>((set, get) => ({
  ready: false,
  config: null,
  roles: [],
  theme: 'command',
  view: 'incidents',
  isAdmin: true,

  incidents: [],
  activeId: null,
  directory: [],
  links: [],

  oncall: null,
  statusPage: null,
  runbooks: [],
  slos: [],

  modal: null,
  assignSlot: null,
  deleteId: null,
  emailKey: null,
  emailDraft: null,
  lastEmail: null,
  draft: null,
  draftMode: null,
  busy: false,
  error: null,

  init: async () => {
    await guard(set, async () => {
      const [config, roles, incidents, directory] = await Promise.all([
        api.config(), api.roles(), api.incidents(), api.directory(),
      ])
      const activeId = incidents.find((i) => i.id === 'INC-2026-0047')?.id ?? incidents[0]?.id ?? null
      set({ config, roles, incidents, directory, activeId, ready: true })
      await get().loadLinks()
      await get().loadReadiness()
    })
  },

  setView: (v) => set({ view: v }),
  setTheme: (t) => set({ theme: t }),
  toggleAdmin: () => set((s) => ({ isAdmin: !s.isAdmin, view: !s.isAdmin ? s.view : s.view === 'admin' ? 'incidents' : s.view })),
  closeModal: () => set({ modal: null, assignSlot: null, deleteId: null, emailKey: null, emailDraft: null }),

  active: () => { const s = get(); return s.incidents.find((i) => i.id === s.activeId) ?? s.incidents[0] ?? null },
  selectIncident: (id) => { set({ activeId: id, view: 'warroom' }); get().loadLinks() },
  replace: (inc) => set((s) => ({ incidents: s.incidents.map((i) => (i.id === inc.id ? inc : i)) })),

  patchImpact: async (v) => { const id = get().activeId!; const inc = await guard(set, () => api.patchIncident(id, { impact: v })); if (inc) get().replace(inc) },
  resolveActive: async () => { const id = get().activeId!; const inc = await guard(set, () => api.resolveIncident(id)); if (inc) { get().replace(inc); set({ view: 'rca' }) } },
  openAssign: (slot) => set({ modal: 'assign', assignSlot: slot }),
  assign: async (slot, userId) => { const id = get().activeId!; const inc = await guard(set, () => api.assign(id, slot, userId)); if (inc) get().replace(inc); get().closeModal() },

  editComms: async (key, text) => { const id = get().activeId!; const inc = await guard(set, () => api.editComms(id, key, text)); if (inc) get().replace(inc) },
  approveComms: async (key) => { const id = get().activeId!; const inc = await guard(set, () => api.approveComms(id, key)); if (inc) get().replace(inc) },

  addChild: async (coll) => { const id = get().activeId!; const inc = await guard(set, () => api.addChild(id, coll)); if (inc) get().replace(inc) },
  patchChild: async (coll, itemId, patch) => { const id = get().activeId!; const inc = await guard(set, () => api.patchChild(id, coll, itemId, patch)); if (inc) get().replace(inc) },
  cycleChild: async (coll, itemId) => { const id = get().activeId!; const inc = await guard(set, () => api.cycleChild(id, coll, itemId)); if (inc) get().replace(inc) },
  deleteChild: async (coll, itemId) => { const id = get().activeId!; const inc = await guard(set, () => api.deleteChild(id, coll, itemId)); if (inc) get().replace(inc) },

  loadLinks: async () => { const id = get().activeId; if (!id) { set({ links: [] }); return } const links = await guard(set, () => api.links(id)); set({ links: links ?? [] }) },
  addLink: async (otherId) => { const id = get().activeId!; await guard(set, () => api.addLink(id, otherId)); get().loadLinks() },
  cycleLink: async (otherId) => { const id = get().activeId!; await guard(set, () => api.cycleLink(id, otherId)); get().loadLinks() },
  unlink: async (otherId) => { const id = get().activeId!; await guard(set, () => api.unlink(id, otherId)); get().loadLinks() },

  reloadDirectory: async () => { const directory = await guard(set, () => api.directory()); if (directory) set({ directory }) },
  toggleRole: async (id, roleKey) => { const p = await guard(set, () => api.toggleRole(id, roleKey)); if (p) set((s) => ({ directory: s.directory.map((d) => (d.id === id ? p : d)) })) },
  addPrincipal: async (p) => { await guard(set, () => api.addPrincipal(p)); get().reloadDirectory() },
  deletePrincipal: async (id) => { await guard(set, () => api.deletePrincipal(id)); get().reloadDirectory() },
  openImport: () => set({ modal: 'import' }),

  newIncident: () => set({
    view: 'declare', draftMode: 'create',
    draft: { id: 'new', title: '', sev: 'SEV-3', status: 'Investigating', started: '', duration: '0 min', impact: '', serviceName: '', country: '',
      sel: { business: 'Internal tooling only', geo: 'One store', users: 'Internal users', data: 'No data impact', duration: '< 15 min', service: 'None', regulatory: 'None' } },
  }),
  newIncidentFromDraft: (d) => set({
    view: 'declare', draftMode: 'create',
    draft: { id: 'new', title: '', sev: 'SEV-3', status: 'Investigating', started: '', duration: '0 min', impact: '', serviceName: '', country: '',
      sel: { business: 'Internal tooling only', geo: 'One store', users: 'Internal users', data: 'No data impact', duration: '< 15 min', service: 'None', regulatory: 'None' }, ...d } as DraftIncident,
  }),
  editIncident: (id) => { const inc = get().incidents.find((i) => i.id === id); if (!inc) return
    set({ view: 'declare', draftMode: 'edit', activeId: id,
      draft: { id: inc.id, title: inc.title, sev: inc.sev, status: inc.status, started: inc.started, duration: inc.duration, impact: inc.impact, serviceName: inc.serviceName, country: inc.country, sel: { ...inc.sel } } }) },
  setDraft: (f, v) => set((s) => (s.draft ? { draft: { ...s.draft, [f]: v } } : {})),
  setDraftDim: (k, v) => set((s) => { if (!s.draft) return {}; const sel = { ...s.draft.sel, [k]: v }; return { draft: { ...s.draft, sel, sev: computeSev(sel).level } } }),
  saveDraft: async () => {
    const s = get(); const d = s.draft; if (!d) return
    const payload = { title: d.title, impact: d.impact, serviceName: d.serviceName, country: d.country, sel: d.sel, status: d.status }
    if (s.draftMode === 'create') {
      const inc = await guard(set, () => api.declare(payload))
      if (inc) set((st) => ({ incidents: [inc, ...st.incidents], activeId: inc.id, view: 'warroom', draft: null, draftMode: null }))
    } else {
      const inc = await guard(set, () => api.editIncident(d.id, payload))
      if (inc) { get().replace(inc); set({ activeId: inc.id, view: 'warroom', draft: null, draftMode: null }) }
    }
  },
  cancelDraft: () => set({ draft: null, draftMode: null, view: 'incidents' }),
  askDelete: (id) => set({ modal: 'delete', deleteId: id }),
  confirmDelete: async () => {
    const s = get(); const id = s.deleteId; if (!id) return
    await guard(set, () => api.deleteIncident(id))
    set((st) => { const incidents = st.incidents.filter((i) => i.id !== id)
      const activeId = st.activeId === id ? incidents[0]?.id ?? null : st.activeId
      return { incidents, activeId, modal: null, deleteId: null } })
    get().loadLinks()
  },

  openEmail: async (key) => { const id = get().activeId!; const draft = await guard(set, () => api.emailDraft(id, key)); if (draft) set({ modal: 'email', emailKey: key, emailDraft: draft }) },
  setEmailField: (f, v) => set((s) => (s.emailDraft ? { emailDraft: { ...s.emailDraft, [f]: v } } : {})),
  setRecip: (id, mode) => set((s) => { if (!s.emailDraft) return {}; const r = { ...s.emailDraft.recips }; if (r[id] === mode) delete r[id]; else r[id] = mode; return { emailDraft: { ...s.emailDraft, recips: r } } }),
  sendEmail: async () => {
    const s = get(); const d = s.emailDraft; const key = s.emailKey; const id = s.activeId; if (!d || !key || !id) return
    const res = await guard(set, () => api.sendEmail({ incidentId: id, key, subject: d.subject, body: d.body, recips: d.recips }))
    if (res) { const inc = await api.incident(id); get().replace(inc); set({ modal: null, emailKey: null, emailDraft: null, lastEmail: res.note }) }
  },

  loadReadiness: async () => {
    await guard(set, async () => {
      const [oncall, statusPage, runbooks, slos] = await Promise.all([
        api.readinessDoc<OncallDoc>('oncall'), api.readinessDoc<StatusPageDoc>('statusPage'), api.runbooks(), api.slos(),
      ])
      set({ oncall, statusPage, runbooks, slos })
    })
  },
  saveOncall: async (doc) => { set({ oncall: doc }); await guard(set, () => api.putReadinessDoc('oncall', doc)) },
  saveStatusPage: async (doc) => { set({ statusPage: doc }); await guard(set, () => api.putReadinessDoc('statusPage', doc)) },
  saveRunbook: async (rb) => { const updated = await guard(set, () => api.updateRunbook(rb)); if (updated) set((s) => ({ runbooks: s.runbooks.map((r) => (r.id === rb.id ? updated : r)) })) },
  attachRunbook: async (id) => { const inc = get().activeId; if (!inc) return; await guard(set, () => api.attachRunbook(id, inc)); const fresh = await api.incident(inc); get().replace(fresh); set({ view: 'warroom' }) },
}))
