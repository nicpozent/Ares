import { useStore } from '../store'
import { computeSev, sevBg } from '../lib/severity'
import { DECLARE_DIMS } from '../lib/constants'
import { Kicker, Btn, display, mono } from '../components/ui'
import type { SeverityDimensions } from '../types'

const AUTO_STEPS = [
  'Create the incident record & ServiceNow ticket',
  'Open a Microsoft Teams channel + bridge',
  'Invite responders & assign incident roles',
  'Pin dashboard, timeline & Adaptive Card',
  'Correlate alerts, changes & dependencies',
  'Start the AI scribe & real-time timeline',
]

export function Declare() {
  const s = useStore()
  const d = s.draft
  if (!d) {
    return (
      <section style={{ maxWidth: 1120, margin: '0 auto' }}>
        <Kicker>DECLARE INCIDENT</Kicker>
        <p style={{ color: 'var(--muted)' }}>No draft in progress. <button onClick={s.newIncident} style={{ border: 'none', background: 'transparent', color: 'var(--brandA)', cursor: 'pointer', fontWeight: 600 }}>Start a new incident →</button></p>
      </section>
    )
  }
  const sev = computeSev(d.sel)
  const label = (f: keyof typeof d, ph: string, val: string, onC: (v: string) => void, area = false) => (
    <div>
      <div style={{ ...mono, fontSize: 11, color: 'var(--faint)', marginBottom: 6 }}>{ph}</div>
      {area
        ? <textarea className="aresin" value={val} onChange={(e) => onC(e.target.value)} style={{ width: '100%', minHeight: 56, background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13.5, resize: 'vertical' }} />
        : <input className="aresin" value={val} onChange={(e) => onC(e.target.value)} style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13.5 }} />}
    </div>
  )

  return (
    <section style={{ maxWidth: 1120, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <Kicker>{s.draftMode === 'edit' ? 'EDIT INCIDENT' : 'DECLARE INCIDENT'}</Kicker>
        <h1 style={{ ...display, fontSize: 29, fontWeight: 700, letterSpacing: -0.5 }}>{s.draftMode === 'edit' ? 'Edit incident details' : 'Deterministic severity classification'}</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, maxWidth: 660, lineHeight: 1.55 }}>Severity is driven by explicit rules — not the model. Fill the details, set each dimension; ARES computes severity and routes the response.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 13 }}>
            {label('title', 'TITLE', d.title, (v) => s.setDraft('title', v))}
            {label('impact', 'IMPACT', d.impact, (v) => s.setDraft('impact', v), true)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {label('serviceName', 'AFFECTED SERVICE', d.serviceName, (v) => s.setDraft('serviceName', v))}
              {label('country', 'COUNTRY / ENTITY', d.country, (v) => s.setDraft('country', v))}
            </div>
          </div>
          {DECLARE_DIMS.map((dim) => (
            <div key={dim.key} style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel)', padding: '14px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 10, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ ...mono, fontSize: 10, color: 'var(--faint)' }}>{dim.tag}</span>{dim.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {dim.opts.map((o) => {
                  const active = d.sel[dim.key as keyof SeverityDimensions] === o
                  return <button key={o} className="aresbtn" onClick={() => s.setDraftDim(dim.key as keyof SeverityDimensions, o)}
                    style={{ cursor: 'pointer', padding: '8px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, border: `1px solid ${active ? 'transparent' : 'var(--line)'}`, background: active ? 'var(--grad)' : 'var(--panel2)', color: active ? '#fff' : 'var(--muted)' }}>{o}</button>
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'sticky', top: 90, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            <div style={{ padding: 22, textAlign: 'center', background: sevBg(sev.level) }}>
              <div style={{ ...mono, fontSize: 11, letterSpacing: 1.4, color: '#fff', opacity: 0.85, marginBottom: 8 }}>COMPUTED SEVERITY</div>
              <div style={{ ...display, fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{sev.level}</div>
            </div>
            <div style={{ padding: '18px 20px' }}>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--faint)', marginBottom: 6 }}>DECIDING RULE</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, marginBottom: 16 }}>{sev.reason}</div>
              <Btn variant="primary" onClick={s.saveDraft} style={{ width: '100%', padding: 13, borderRadius: 11 }}>{s.draftMode === 'edit' ? 'Save changes →' : 'Declare & open war room →'}</Btn>
              <Btn onClick={s.cancelDraft} style={{ width: '100%', marginTop: 9, background: 'transparent', color: 'var(--muted)', padding: 10, borderRadius: 11 }}>Cancel</Btn>
            </div>
          </div>
          <div style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel2)', padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 11 }}>On declare, ARES automatically…</div>
            {AUTO_STEPS.map((t) => <div key={t} style={{ display: 'flex', gap: 9, padding: '5px 0', fontSize: 12.5, color: 'var(--muted)', alignItems: 'flex-start' }}><span style={{ color: 'var(--ok)', fontWeight: 700 }}>✓</span><span>{t}</span></div>)}
          </div>
        </div>
      </div>
    </section>
  )
}
