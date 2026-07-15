import { useStore } from '../store'
import { sevBg, statusColor } from '../lib/severity'
import { Btn, PageHeader, mono } from '../components/ui'

export function Incidents() {
  const s = useStore()
  const dir = s.directory
  return (
    <section style={{ maxWidth: 1180, margin: '0 auto' }}>
      <PageHeader kicker="INCIDENT REGISTER" title="All incidents"
        right={<Btn variant="primary" onClick={s.newIncident}>+ Declare incident</Btn>} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {s.incidents.map((i) => {
          const ic = dir.find((u) => u.id === i.assign?.ic)
          return (
            <div key={i.id} className="arescard" style={{ borderRadius: 14, border: `1px solid ${i.id === s.activeId ? 'var(--brandA)' : 'var(--line)'}`, background: 'var(--panel)', padding: '16px 20px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 76 }}>
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 7, color: '#fff', background: sevBg(i.sev) }}>{i.sev}</span>
                <span style={{ ...mono, fontSize: 10, color: statusColor(i.status) }}>{i.status}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ ...mono, fontSize: 11.5, color: 'var(--brandA)', fontWeight: 600 }}>{i.id}</span>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{i.title || 'Untitled incident'}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{i.impact || '—'}</div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8, ...mono, fontSize: 10.5, color: 'var(--faint)', flexWrap: 'wrap' }}>
                  <span>{i.serviceName || '—'}</span><span>{i.country || '—'}</span>
                  <span>IC · {ic?.name ?? 'Unassigned'}</span><span>{i.evidence.length} evidence</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="soft" onClick={() => s.selectIncident(i.id)} style={{ padding: '9px 15px', fontSize: 12.5 }}>Open</Btn>
                <Btn onClick={() => s.editIncident(i.id)} title="Edit" style={{ background: 'var(--panel2)', color: 'var(--muted)', width: 36, height: 36, padding: 0 }}>✎</Btn>
                <Btn onClick={() => s.askDelete(i.id)} title="Delete" style={{ background: 'var(--panel2)', color: 'var(--accent)', width: 36, height: 36, padding: 0 }}>🗑</Btn>
              </div>
            </div>
          )
        })}
        {!s.incidents.length && <div style={{ textAlign: 'center', padding: 60, color: 'var(--faint)', fontSize: 14 }}>No incidents. Declare one to begin.</div>}
      </div>
    </section>
  )
}
