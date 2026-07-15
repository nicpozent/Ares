import { useStore } from '../store'
import { TYPE_COLORS } from '../lib/constants'
import { Btn, PageHeader, Editable, mono } from '../components/ui'

const SCRIBE_SOURCES: { src: string; detail: string; c: string }[] = [
  { src: 'Teams messages', detail: 'channel + bridge chat', c: '#6c7fb0' },
  { src: 'Incident commands', detail: '/incident /decision /resolve', c: '#2E93E6' },
  { src: 'Monitoring events', detail: 'Datadog · Sentinel · Azure Monitor', c: '#ff3d6e' },
  { src: 'ITSM updates', detail: 'ServiceNow tickets & tasks', c: '#37d39b' },
  { src: 'Change & deploy', detail: 'Azure DevOps · GitHub', c: '#8a63d2' },
  { src: 'Audit logs', detail: 'Entra sign-ins · admin actions', c: '#ffb020' },
  { src: 'Human milestones', detail: 'responder-confirmed events', c: '#37d39b' },
  { src: 'Dependency graph', detail: 'CMDB service map', c: '#2E93E6' },
]

export function Timeline() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return null

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto' }}>
      <PageHeader kicker="AI SCRIBE · REAL-TIME TIMELINE" title="One reconstructed truth"
        right={<Btn onClick={() => s.addChild('timeline')}>+ Add event</Btn>} />

      <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--brandB) 12%, var(--panel)), var(--panel))', padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <span style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--brandA)', fontWeight: 600 }}>▣ WHERE THE SCRIBE FEEDS FROM</span>
          <span style={{ marginLeft: 'auto', ...mono, fontSize: 10, color: 'var(--ok)' }}>● 8 sources connected</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {SCRIBE_SOURCES.map((src) => (
            <div key={src.src} style={{ padding: '11px 13px', borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: src.c }} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{src.src}</span>
              </div>
              <div style={{ ...mono, fontSize: 10, color: 'var(--faint)', lineHeight: 1.4 }}>{src.detail}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          The scribe fuses these signals into a single record — it does <strong style={{ color: 'var(--text)' }}>not</strong> rely on meeting transcripts alone. Transcript access via Microsoft Graph is admin-gated and off by default. Every entry is editable; click text to correct, the timestamp to adjust, or the type tag to reclassify.
        </div>
      </div>

      <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: '8px 22px 14px' }}>
        {inc.timeline.map((e) => (
          <div key={e.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
            <div style={{ width: 70, flexShrink: 0, textAlign: 'right' }}>
              <Editable value={e.t} onCommit={(v) => s.patchChild('timeline', e.id, { t: v })}
                style={{ ...mono, fontSize: 12, fontWeight: 600, color: 'var(--text)' }} />
              <div style={{ ...mono, fontSize: 9.5, color: 'var(--faint)', marginTop: 2 }}>CET</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4, flexWrap: 'wrap' }}>
                <button className="aresbtn" onClick={() => s.cycleChild('timeline', e.id)} title="Click to reclassify"
                  style={{ cursor: 'pointer', border: 'none', ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, color: '#fff', background: TYPE_COLORS[e.type] ?? '#6c7fb0' }}>{e.type}</button>
                <span style={{ ...mono, fontSize: 11, color: 'var(--brandA)' }}>{e.src}</span>
              </div>
              <Editable value={e.text} onCommit={(v) => s.patchChild('timeline', e.id, { text: v })}
                style={{ fontSize: 13.5, lineHeight: 1.5 }} />
            </div>
            <button className="aresbtn" onClick={() => s.deleteChild('timeline', e.id)} title="Delete"
              style={{ flexShrink: 0, alignSelf: 'flex-start', border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 15 }}>×</button>
          </div>
        ))}
      </div>
    </section>
  )
}
