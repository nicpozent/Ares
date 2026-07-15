import { useStore } from '../store'
import type { EscalationPolicy, OncallDoc, Page } from '../store'
import { PageHeader, Btn, Avatar, mono } from '../components/ui'

const nowHM = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

export function Oncall() {
  const s = useStore()
  if (!s.oncall) return null
  const doc = s.oncall

  const pageNow = (policy: EscalationPolicy) => {
    const page: Page = {
      id: 'pg' + Date.now(),
      target: 'Primary on-call · ' + policy.name,
      via: 'Teams · Push',
      state: 'Paging',
      at: nowHM(),
      ackAt: null,
    }
    const next: OncallDoc = { ...doc, pages: [page, ...doc.pages] }
    s.saveOncall(next)
  }

  const acknowledge = (id: string) => {
    const at = nowHM()
    const next: OncallDoc = {
      ...doc,
      pages: doc.pages.map((p) => (p.id === id ? { ...p, state: 'Acknowledged', ackAt: at } : p)),
    }
    s.saveOncall(next)
  }

  return (
    <section style={{ maxWidth: 1120, margin: '0 auto' }}>
      <PageHeader kicker="ON-CALL & PAGING" title="Who's on point" />

      {/* SCHEDULES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start', marginBottom: 18 }}>
        {doc.schedules.map((sc) => (
          <div key={sc.id} style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>{sc.team}</h3>
              <span style={{ marginLeft: 'auto', ...mono, fontSize: 10, color: 'var(--faint)' }}>{sc.tz}</span>
            </div>
            <div style={{ ...mono, fontSize: 10.5, color: 'var(--faint)', marginBottom: 14 }}>{sc.rotation}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {sc.shifts.map((sh) => {
                const u = s.directory.find((x) => x.id === sh.who)
                const on = sh.state === 'on'
                const dot = on ? 'var(--ok)' : 'var(--faint)'
                return (
                  <div key={sh.id} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar name={u?.name ?? 'Unassigned'} type={u?.type} size={30} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{u?.name ?? 'Unassigned'}</span>
                      <span style={{ display: 'block', fontSize: 10.5, color: 'var(--faint)' }}>{sh.label}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot }} />
                      <span style={{ ...mono, fontSize: 9.5, letterSpacing: 0.4, color: dot }}>{on ? 'ON CALL' : 'UPCOMING'}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* ESCALATION POLICIES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {doc.escalation.map((ep) => (
            <div key={ep.id} style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>{ep.name}</h3>
                <Btn variant="hot" onClick={() => pageNow(ep)} style={{ marginLeft: 'auto', fontSize: 11.5, padding: '6px 13px', borderRadius: 8 }}>Page now</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {ep.steps.map((st, i) => (
                  <div key={st.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                    <span style={{ ...mono, fontSize: 11, color: 'var(--brandA)', width: 52, flexShrink: 0 }}>{st.after}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{st.target}</span>
                    </span>
                    <span style={{ ...mono, fontSize: 10, color: 'var(--faint)', flexShrink: 0 }}>{st.via}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* LIVE PAGES */}
        <div style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'arespulse 1.4s infinite' }} />
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Active pages</h3>
            <span style={{ marginLeft: 'auto', ...mono, fontSize: 10, color: 'var(--faint)' }}>acknowledge to stop escalation</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {doc.pages.map((p) => {
              const ack = p.state === 'Acknowledged'
              const pillColor = ack ? 'var(--ok)' : 'var(--accent)'
              const pillBg = ack ? 'color-mix(in srgb,var(--ok) 15%,transparent)' : 'color-mix(in srgb,var(--accent) 15%,transparent)'
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 11, background: 'var(--panel2)', border: '1px solid var(--line)' }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{p.target}</span>
                    <span style={{ display: 'block', ...mono, fontSize: 10, color: 'var(--faint)' }}>{p.via} · sent {p.at}</span>
                  </span>
                  {ack ? (
                    <span style={{ border: `1px solid ${pillColor}`, background: pillBg, color: pillColor, ...mono, fontSize: 10.5, fontWeight: 600, padding: '6px 12px', borderRadius: 8 }}>ack {p.ackAt}</span>
                  ) : (
                    <button className="aresbtn" onClick={() => acknowledge(p.id)} style={{ cursor: 'pointer', border: `1px solid ${pillColor}`, background: pillBg, color: pillColor, ...mono, fontSize: 10.5, fontWeight: 600, padding: '6px 12px', borderRadius: 8 }}>Acknowledge</button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
