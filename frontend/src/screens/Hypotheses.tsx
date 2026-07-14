import { useStore } from '../store'
import { HYPO_STYLE } from '../lib/constants'
import { Btn, PageHeader, Editable, Avatar, mono } from '../components/ui'

export function Hypotheses() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return null

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto' }}>
      <PageHeader kicker="HYPOTHESIS REGISTER" title="Working theories"
        right={<Btn onClick={() => s.addChild('hypotheses')}>+ Add hypothesis</Btn>} />
      <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 18, lineHeight: 1.5 }}>
        AI may suggest hypotheses, but each is labelled and owned. <span style={{ color: 'var(--text)', fontWeight: 600 }}>Click the status to advance it; click any text to edit.</span>
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {inc.hypotheses.map((h) => {
          const [sc, sbg] = HYPO_STYLE[h.status] ?? ['#6c7fb0', 'rgba(108,127,176,.14)']
          return (
            <div key={h.id} className="arescard" style={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <Avatar name={h.owner} size={26} />
                  <Editable value={h.title} onCommit={(v) => s.patchChild('hypotheses', h.id, { title: v })}
                    style={{ fontSize: 15, fontWeight: 600 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ padding: '11px 13px', borderRadius: 9, background: 'color-mix(in srgb, var(--ok) 10%, transparent)', borderLeft: '2px solid var(--ok)' }}>
                    <div style={{ ...mono, fontSize: 9.5, letterSpacing: 0.6, color: 'var(--ok)', fontWeight: 600, marginBottom: 5 }}>EVIDENCE FOR</div>
                    <Editable value={h.forE} onCommit={(v) => s.patchChild('hypotheses', h.id, { forE: v })}
                      style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--muted)' }} />
                  </div>
                  <div style={{ padding: '11px 13px', borderRadius: 9, background: 'color-mix(in srgb, var(--accent) 9%, transparent)', borderLeft: '2px solid var(--accent)' }}>
                    <div style={{ ...mono, fontSize: 9.5, letterSpacing: 0.6, color: 'var(--accent)', fontWeight: 600, marginBottom: 5 }}>EVIDENCE AGAINST</div>
                    <Editable value={h.againstE} onCommit={(v) => s.patchChild('hypotheses', h.id, { againstE: v })}
                      style={{ fontSize: 12.5, lineHeight: 1.45, color: 'var(--muted)' }} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 130 }}>
                <div style={{ ...mono, fontSize: 10, color: 'var(--faint)', marginBottom: 7, display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <span>OWNER ·</span>
                  <Editable value={h.owner} onCommit={(v) => s.patchChild('hypotheses', h.id, { owner: v })} />
                </div>
                <button className="aresbtn" onClick={() => s.cycleChild('hypotheses', h.id)}
                  style={{ cursor: 'pointer', border: `1px solid ${sc}`, background: sbg, color: sc, ...mono, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.4, padding: '7px 13px', borderRadius: 8 }}>{h.status}</button>
                <button className="aresbtn" onClick={() => s.deleteChild('hypotheses', h.id)} title="Delete"
                  style={{ display: 'block', marginLeft: 'auto', marginTop: 8, border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 12 }}>Remove</button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
