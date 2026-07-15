import { useStore } from '../store'
import { Btn, PageHeader, Editable, mono } from '../components/ui'

const prioColor: Record<string, string> = { P1: '#ff3d6e', P2: '#ffb020', P3: '#2E93E6', '—': '#6c7fb0' }

function statusColor(st: string): string {
  if (st === 'Done') return 'var(--ok)'
  if (st === 'In progress') return 'var(--warn)'
  if (st === 'Rejected') return 'var(--faint)'
  return 'var(--brandA)'
}

export function Actions() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return null

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto' }}>
      <PageHeader kicker="CORRECTIVE & PREVENTIVE ACTIONS" title="Governance"
        right={<Btn variant="ghost" onClick={() => s.addChild('actions')}>+ Add action</Btn>} />

      <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 16, lineHeight: 1.55, maxWidth: 780 }}>
        Actions sync to Jira, Azure DevOps or ServiceNow. ARES flags weak actions — vague reminders or manual
        vigilance that add no systemic control. <span style={{ color: 'var(--text)', fontWeight: 600 }}>Click priority or status to change; click text to edit.</span>
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {inc.actions.map((a) => {
          const pc = prioColor[a.prio] ?? prioColor['—']
          const stc = statusColor(a.status)
          const cursor = a.weak ? 'default' : 'pointer'
          return (
            <div key={a.id} style={{
              borderRadius: 12,
              border: `1px solid ${a.weak ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--line)'}`,
              background: a.weak ? 'color-mix(in srgb, var(--accent) 7%, var(--panel))' : 'var(--panel)',
              padding: '15px 18px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: a.weak ? 4 : 8, flexWrap: 'wrap' }}>
                  {a.weak && (
                    <span style={{ ...mono, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.5, padding: '3px 8px', borderRadius: 5, background: 'var(--accent)', color: '#fff' }}>
                      ⚠ WEAK ACTION — AI flagged
                    </span>
                  )}
                  {a.weak
                    ? <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)' }}>{a.desc}</span>
                    : <Editable value={a.desc} onCommit={(v) => s.patchChild('actions', a.id, { desc: v })} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }} />}
                </div>
                {a.weak
                  ? <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>→ Recommend a systemic control instead.</div>
                  : (
                    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', ...mono, fontSize: 11, color: 'var(--faint)' }}>
                      <span style={{ display: 'flex', gap: 4 }}>OWNER · <Editable value={a.owner} onCommit={(v) => s.patchChild('actions', a.id, { owner: v })} /></span>
                      <span style={{ display: 'flex', gap: 4 }}>DUE · <Editable value={a.due} onCommit={(v) => s.patchChild('actions', a.id, { due: v })} /></span>
                    </div>
                  )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="aresbtn" onClick={a.weak ? undefined : () => s.cycleChild('actions-prio', a.id)}
                  style={{ cursor, border: `1px solid ${pc}`, background: 'transparent', ...mono, fontSize: 11, fontWeight: 700, color: pc, width: 36, textAlign: 'center', padding: '5px 0', borderRadius: 7 }}>
                  {a.prio}
                </button>
                <button className="aresbtn" onClick={a.weak ? undefined : () => s.cycleChild('actions-status', a.id)}
                  style={{ cursor, border: `1px solid ${stc}`, background: 'transparent', color: stc, ...mono, fontSize: 11, fontWeight: 600, padding: '6px 12px', borderRadius: 7, minWidth: 104 }}>
                  {a.status}
                </button>
                <button className="aresbtn" onClick={() => s.deleteChild('actions', a.id)} title="Delete"
                  style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 15 }}>×</button>
              </div>
            </div>
          )
        })}
        {!inc.actions.length && <div style={{ textAlign: 'center', padding: 60, color: 'var(--faint)', fontSize: 14 }}>No corrective actions yet. Add one to begin.</div>}
      </div>
    </section>
  )
}
