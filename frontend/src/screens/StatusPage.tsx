import { useStore } from '../store'
import type { StatusPageDoc } from '../store'
import { PageHeader, Editable, mono, display } from '../components/ui'

const compMeta: Record<string, [string, string]> = {
  operational: ['Operational', 'var(--ok)'],
  degraded: ['Degraded', 'var(--warn)'],
  outage: ['Major outage', 'var(--accent)'],
}
const compOrder = ['operational', 'degraded', 'outage']

const updMeta: Record<string, [string, string]> = {
  investigating: ['Investigating', 'var(--warn)'],
  identified: ['Identified', 'var(--brandA)'],
  monitoring: ['Monitoring', 'var(--brandA)'],
  resolved: ['Resolved', 'var(--ok)'],
}
const updOrder = ['investigating', 'identified', 'monitoring', 'resolved']

function nowLabel(): string {
  const d = new Date()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm} CET`
}

export function StatusPage() {
  const s = useStore()
  const doc = s.statusPage
  if (!doc) return null

  const save = (mutate: (d: StatusPageDoc) => void) => {
    const next: StatusPageDoc = {
      ...doc,
      components: doc.components.map((c) => ({ ...c })),
      updates: doc.updates.map((u) => ({ ...u })),
    }
    mutate(next)
    s.saveStatusPage(next)
  }

  const togglePublish = () => save((d) => { d.published = !d.published })
  const cycleComponent = (id: string) => save((d) => {
    d.components = d.components.map((c) => (c.id === id ? { ...c, state: compOrder[(compOrder.indexOf(c.state) + 1) % compOrder.length] } : c))
  })
  const cycleUpdateState = (id: string) => save((d) => {
    d.updates = d.updates.map((u) => (u.id === id ? { ...u, state: updOrder[(updOrder.indexOf(u.state) + 1) % updOrder.length] } : u))
  })
  const editUpdate = (id: string, field: 'title' | 'body', v: string) => save((d) => {
    d.updates = d.updates.map((u) => (u.id === id ? { ...u, [field]: v } : u))
  })
  const delUpdate = (id: string) => save((d) => { d.updates = d.updates.filter((u) => u.id !== id) })
  const addUpdate = () => save((d) => {
    d.updates = [
      { id: 'su' + Date.now(), t: nowLabel(), state: 'investigating', title: 'New update — click to edit', body: 'Describe the customer-facing update.' },
      ...d.updates,
    ]
  })

  const overall = doc.components.some((c) => c.state === 'outage')
    ? ['Some systems down', 'var(--accent)']
    : doc.components.some((c) => c.state === 'degraded')
      ? ['Degraded performance', 'var(--warn)']
      : ['All systems operational', 'var(--ok)']

  const publishBg = doc.published ? 'color-mix(in srgb,var(--ok) 16%,transparent)' : 'var(--grad)'
  const publishColor = doc.published ? 'var(--ok)' : '#fff'

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto' }}>
      <PageHeader kicker="CUSTOMER STATUS PAGE" title="Public status"
        right={
          <button className="aresbtn" onClick={togglePublish}
            style={{ border: '1px solid var(--line)', background: publishBg, color: publishColor, cursor: 'pointer', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            {doc.published ? '● Live' : 'Publish page'}
          </button>
        } />

      <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(120deg, color-mix(in srgb, var(--brandB) 12%, var(--panel)), var(--panel))' }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: overall[1], boxShadow: `0 0 10px ${overall[1]}` }} />
          <div style={{ ...display, fontSize: 19, fontWeight: 700 }}>{overall[0]}</div>
          <div style={{ marginLeft: 'auto', ...mono, fontSize: 11, color: 'var(--faint)' }}>{doc.url}</div>
        </div>
        <div style={{ padding: '10px 24px' }}>
          {doc.components.map((c) => {
            const meta = compMeta[c.state] ?? compMeta.operational
            return (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{c.name}</span>
                <button className="aresbtn" onClick={() => cycleComponent(c.id)} title="Click to change state"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${meta[1]}`, background: 'transparent', padding: '5px 12px', borderRadius: 20 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta[1] }} />
                  <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: meta[1] }}>{meta[0]}</span>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 12px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Incident updates</h3>
        <button className="aresbtn" onClick={addUpdate}
          style={{ marginLeft: 'auto', border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)', cursor: 'pointer', padding: '8px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600 }}>
          + Add update
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {doc.updates.map((u) => {
          const meta = updMeta[u.state] ?? updMeta.investigating
          return (
            <div key={u.id} style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 8 }}>
                <button className="aresbtn" onClick={() => cycleUpdateState(u.id)}
                  style={{ cursor: 'pointer', border: `1px solid ${meta[1]}`, background: 'transparent', color: meta[1], ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.4, padding: '3px 9px', borderRadius: 6 }}>
                  {meta[0]}
                </button>
                <Editable value={u.title} onCommit={(v) => editUpdate(u.id, 'title', v)} style={{ fontSize: 14, fontWeight: 600 }} />
                <span style={{ marginLeft: 'auto', ...mono, fontSize: 10.5, color: 'var(--faint)' }}>{u.t}</span>
                <button className="aresbtn" onClick={() => delUpdate(u.id)} title="Delete"
                  style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
              <Editable value={u.body} onCommit={(v) => editUpdate(u.id, 'body', v)} style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
