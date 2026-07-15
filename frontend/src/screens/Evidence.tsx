import { useStore } from '../store'
import { EVIDENCE_KINDS } from '../lib/constants'
import { Btn, PageHeader, Editable, mono } from '../components/ui'

export function Evidence() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return null

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto' }}>
      <PageHeader kicker="CHAIN OF EVIDENCE" title="Evidence"
        right={<Btn variant="primary" onClick={() => s.addChild('evidence')}>+ Add evidence</Btn>} />
      <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 16, lineHeight: 1.5 }}>
        Attach logs, metrics, screenshots, config/change records and links. Each item is immutably timestamped and feeds the RCA. Click the kind tag to change it; click any text to edit.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {inc.evidence.map((e) => {
          const kd = EVIDENCE_KINDS.find((k) => k.k === e.kind) ?? EVIDENCE_KINDS[0]
          return (
            <div key={e.id} className="arescard" style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel)', padding: '15px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center' }}>
              <button className="aresbtn" onClick={() => s.cycleChild('evidence', e.id)} title="Change kind"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 72, border: '1px solid var(--line)', background: 'var(--panel2)', borderRadius: 10, padding: '9px 6px' }}>
                <span style={{ fontSize: 17, color: kd.c }}>{kd.glyph}</span>
                <span style={{ ...mono, fontSize: 9, letterSpacing: 0.4, color: 'var(--faint)' }}>{kd.label}</span>
              </button>
              <div style={{ minWidth: 0 }}>
                <Editable value={e.title} onCommit={(v) => s.patchChild('evidence', e.id, { title: v })}
                  style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }} />
                <Editable value={e.note} onCommit={(v) => s.patchChild('evidence', e.id, { note: v })}
                  style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 6 }} />
                <div style={{ display: 'flex', gap: 14, ...mono, fontSize: 10, color: 'var(--faint)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', gap: 4 }}>SRC ·<Editable value={e.source} onCommit={(v) => s.patchChild('evidence', e.id, { source: v })} /></span>
                  <span style={{ display: 'flex', gap: 4 }}>REF ·<Editable value={e.ref} onCommit={(v) => s.patchChild('evidence', e.id, { ref: v })} /></span>
                  <span>{e.by} · {e.t}</span>
                </div>
              </div>
              <button className="aresbtn" onClick={() => s.deleteChild('evidence', e.id)} title="Delete"
                style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          )
        })}
        {!inc.evidence.length && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--faint)', fontSize: 13.5 }}>
            No evidence attached yet. Add logs, metrics or screenshots to build the chain.
          </div>
        )}
      </div>
    </section>
  )
}
