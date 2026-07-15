import { useStore } from '../store'
import type { Runbook } from '../types'
import { PageHeader, Btn, Editable, display, mono } from '../components/ui'

export function Runbooks() {
  const s = useStore()

  const commitTitle = (rb: Runbook, title: string) => {
    if (title === rb.title) return
    s.saveRunbook({ ...rb, title })
  }

  const toggleStep = (rb: Runbook, stepId: string) => {
    const updated: Runbook = {
      ...rb,
      steps: rb.steps.map((st) => (st.id === stepId ? { ...st, done: !st.done } : st)),
    }
    s.saveRunbook(updated)
  }

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto' }}>
      <PageHeader kicker="RUNBOOKS" title="Playbooks" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {s.runbooks.map((rb) => {
          const done = rb.steps.filter((st) => st.done).length
          const total = rb.steps.length
          const pct = total ? Math.round((done / total) * 100) : 0
          return (
            <div key={rb.id} className="arescard" style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Editable value={rb.title} onCommit={(v) => commitTitle(rb, v)} style={{ fontSize: 15, fontWeight: 600, marginBottom: 5 }} />
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', ...mono, fontSize: 10.5, color: 'var(--faint)' }}>
                    <span>SERVICE · {rb.service}</span>
                    <span>TRIGGER · {rb.trigger}</span>
                    <span>OWNER · {rb.owner}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ ...display, fontSize: 18, fontWeight: 700, color: 'var(--brandA)' }}>{pct}%</div>
                  <div style={{ ...mono, fontSize: 10, color: 'var(--faint)' }}>{done}/{total} steps</div>
                </div>
                <Btn variant="primary" onClick={() => s.attachRunbook(rb.id)} style={{ flexShrink: 0, fontSize: 12, padding: '9px 15px', borderRadius: 9 }}>Attach to incident</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                {rb.steps.map((st) => (
                  <button key={st.id} className="aresbtn" onClick={() => toggleStep(rb, st.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', background: 'transparent', padding: '7px 0' }}>
                    <span style={{ width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${st.done ? 'var(--ok)' : 'var(--line)'}`, background: st.done ? 'var(--ok)' : 'transparent', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>{st.done ? '✓' : ''}</span>
                    <span style={{ fontSize: 13, color: st.done ? 'var(--faint)' : 'var(--text)', textDecoration: st.done ? 'line-through' : 'none' }}>{st.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
