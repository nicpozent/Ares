import { useStore } from '../store'
import { sevBg } from '../lib/severity'
import { ROSTER_SLOTS, TYPE_COLORS } from '../lib/constants'
import { Btn, Editable, Avatar, Kicker, display, mono } from '../components/ui'

const SPARK = [30, 34, 31, 36, 33, 38, 35, 88, 92, 95, 90, 94, 89, 72, 58, 44, 30, 22, 16, 12]

export function WarRoom() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return <div style={{ color: 'var(--faint)' }}>No active incident.</div>
  const dir = s.directory
  const roleLabel = (k: string) => s.roles.find((r) => r.key === k)?.label ?? k
  const topH = inc.hypotheses.find((h) => h.status === 'Confirmed') ?? inc.hypotheses.find((h) => h.status === 'Probable') ?? inc.hypotheses[0]
  const feed = inc.timeline.slice(-6)

  const quick = [
    { label: '+ Add update', onClick: () => s.setView('comms') },
    { label: 'Assign roles', onClick: () => s.setView('warroom') },
    { label: 'Record decision', onClick: async () => { await s.addChild('timeline'); s.setView('timeline') } },
    { label: 'Add evidence', onClick: async () => { await s.addChild('evidence'); s.setView('evidence') } },
    { label: 'Open dashboard', onClick: () => s.setView('analytics') },
    { label: 'View hypotheses', onClick: () => s.setView('hypotheses') },
  ]
  const resources = [
    { src: 'Datadog', label: 'Payment latency & error-rate dashboard' },
    { src: 'ServiceNow', label: `${inc.id} · linked tickets` },
    { src: 'Azure', label: 'CHG-18442 change record & deploy log' },
    { src: 'Sentinel', label: 'TLS anomaly detection — store network' },
    { src: 'CMDB', label: `${inc.serviceName || 'service'} dependency graph` },
  ]
  const relMeta: Record<string, [string, string]> = { related: ['Related', 'var(--brandA)'], child: ['Child', 'var(--brandB)'], duplicate: ['Duplicate', 'var(--faint)'] }
  const linked = s.links.map((l) => ({ link: l, inc: s.incidents.find((x) => x.id === l.otherId) })).filter((x) => x.inc)
  const linkable = s.incidents.filter((i) => i.id !== inc.id && !s.links.find((l) => l.otherId === i.id))

  return (
    <section style={{ maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <div><Kicker>MICROSOFT TEAMS WAR ROOM</Kicker><h1 style={{ ...display, fontSize: 29, fontWeight: 700, letterSpacing: -0.5 }}>Incident cockpit</h1></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => s.setView('comms')}>Post update</Btn>
          <Btn variant="hot" onClick={s.resolveActive}>Resolve incident</Btn>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--panel)', boxShadow: 'var(--shadow)' }}>
            <div style={{ padding: '16px 20px', background: 'linear-gradient(120deg,rgba(255,61,110,.16),rgba(51,88,212,.10))', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 7, background: sevBg(inc.sev), color: '#fff' }}>{inc.sev}</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{inc.id} — {inc.title}</span>
              <span style={{ marginLeft: 'auto', ...mono, fontSize: 11, color: 'var(--muted)' }}>Adaptive Card</span>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 18 }}>
                {[['STATUS', inc.status], ['STARTED', inc.started], ['DURATION', inc.duration]].map(([k, v]) => (
                  <div key={k}><div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--faint)', marginBottom: 5 }}>{k}</div><div style={{ fontWeight: 600, fontSize: 14, ...(k !== 'STATUS' ? mono : {}) }}>{v}</div></div>
                ))}
              </div>
              <div style={{ padding: '13px 16px', borderRadius: 11, background: 'var(--panel2)', border: '1px solid var(--line)', marginBottom: 16 }}>
                <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--faint)', marginBottom: 5 }}>IMPACT · click to edit</div>
                <Editable value={inc.impact} onCommit={s.patchImpact} style={{ fontSize: 14, lineHeight: 1.5 }} />
              </div>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--faint)', marginBottom: 10 }}>INCIDENT ROLES · click to assign from Entra directory</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 18 }}>
                {ROSTER_SLOTS.map((slot) => {
                  const u = dir.find((x) => x.id === inc.assign?.[slot])
                  return (
                    <button key={slot} className="aresbtn" onClick={() => s.openAssign(slot)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: '1px solid var(--line)', background: 'var(--panel2)', cursor: 'pointer', padding: '9px 11px', borderRadius: 10 }}>
                      {u ? <Avatar name={u.name} type={u.type} size={28} /> : <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--panel2)', border: '1px dashed var(--line)', display: 'grid', placeItems: 'center', color: 'var(--faint)' }}>+</span>}
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', ...mono, fontSize: 9.5, letterSpacing: 0.5, color: 'var(--faint)' }}>{roleLabel(slot)}</span>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: u ? 'var(--text)' : 'var(--faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u?.name ?? 'Unassigned'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
              <div style={{ padding: '13px 16px', borderRadius: 11, border: '1px dashed var(--line)', background: 'linear-gradient(120deg,rgba(51,88,212,.08),transparent)', marginBottom: 18 }}>
                <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--brandA)', marginBottom: 5, fontWeight: 600 }}>CURRENT HYPOTHESIS · {topH ? topH.status.toUpperCase() : 'NONE'}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{topH?.title ?? 'No hypothesis yet — add one in the register.'}</div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
                {quick.map((a) => <Btn key={a.label} variant="soft" onClick={a.onClick} style={{ padding: '9px 15px', fontSize: 12.5 }}>{a.label}</Btn>)}
              </div>
            </div>
          </div>
          <div className="arescard" style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 15 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ok)', animation: 'arespulse 1.6s infinite' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>AI Scribe — live feed</h3>
              <Btn onClick={() => s.setView('timeline')} style={{ marginLeft: 'auto', background: 'var(--panel2)', color: 'var(--muted)', ...mono, fontSize: 10.5, padding: '4px 10px' }}>sources ↗</Btn>
            </div>
            {feed.map((e) => (
              <div key={e.id} style={{ display: 'flex', gap: 13, padding: '9px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ ...mono, fontSize: 11.5, color: 'var(--faint)', flexShrink: 0, width: 60 }}>{e.t.slice(0, 8)}</span>
                <span style={{ ...mono, fontSize: 9.5, fontWeight: 600, letterSpacing: 0.5, padding: '2px 7px', borderRadius: 5, flexShrink: 0, height: 'fit-content', color: '#fff', background: TYPE_COLORS[e.type] ?? '#6c7fb0' }}>{e.type}</span>
                <span style={{ fontSize: 13, lineHeight: 1.45 }}>{e.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="arescard" style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>Pinned dashboard</h3><span style={{ ...mono, fontSize: 10, color: 'var(--faint)', marginLeft: 'auto' }}>Datadog · live</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Metric label="TXN SUCCESS" value="96%" color="var(--ok)" />
              <Metric label="TLS ERRORS/min" value="12" color="var(--warn)" />
            </div>
            <div style={{ height: 70, borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--line)', display: 'flex', alignItems: 'flex-end', gap: 3, padding: 10 }}>
              {SPARK.map((v, i) => <span key={i} style={{ flex: 1, borderRadius: '2px 2px 0 0', background: i >= 7 && i <= 12 ? 'var(--accent)' : i > 12 ? 'var(--ok)' : 'var(--brandA)', height: `${v}%` }} />)}
            </div>
          </div>
          <div className="arescard" style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>Connected context</h3><button onClick={() => s.setView('evidence')} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--brandA)', cursor: 'pointer', fontSize: 11.5, fontWeight: 600 }}>Evidence →</button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {resources.map((x) => <div key={x.src} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 11px', borderRadius: 9, background: 'var(--panel2)', border: '1px solid var(--line)', fontSize: 12.5 }}><span style={{ ...mono, fontSize: 10, color: 'var(--brandA)', width: 64, flexShrink: 0 }}>{x.src}</span><span style={{ flex: 1 }}>{x.label}</span><span style={{ color: 'var(--faint)' }}>→</span></div>)}
            </div>
          </div>
          <div className="arescard" style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Related incidents</h3>
            {linked.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {linked.map(({ link, inc: li }) => (
                  <div key={link.otherId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9, background: 'var(--panel2)', border: '1px solid var(--line)' }}>
                    <span style={{ ...mono, fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 6, color: '#fff', background: sevBg(li!.sev), flexShrink: 0 }}>{li!.sev}</span>
                    <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{li!.title}</span><span style={{ ...mono, fontSize: 9.5, color: 'var(--brandA)' }}>{li!.id}</span></span>
                    <button className="aresbtn" onClick={() => s.cycleLink(link.otherId)} title="Change relationship" style={{ cursor: 'pointer', border: `1px solid ${relMeta[link.rel][1]}`, background: 'transparent', color: relMeta[link.rel][1], ...mono, fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 6 }}>{relMeta[link.rel][0]}</button>
                    <button className="aresbtn" onClick={() => s.selectIncident(link.otherId)} title="Open" style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--faint)', fontSize: 14 }}>↗</button>
                    <button className="aresbtn" onClick={() => s.unlink(link.otherId)} title="Unlink" style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: 'var(--faint)', fontSize: 14 }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {linkable.length > 0 && (
              <>
                <div style={{ ...mono, fontSize: 9.5, letterSpacing: 0.5, color: 'var(--faint)', marginBottom: 7 }}>LINK ANOTHER</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {linkable.map((i) => <button key={i.id} className="aresbtn" onClick={() => s.addLink(i.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', cursor: 'pointer', border: '1px dashed var(--line)', background: 'transparent', padding: '8px 11px', borderRadius: 9 }}><span style={{ color: 'var(--brandA)', fontSize: 14 }}>+</span><span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.title}</span></button>)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--line)' }}>
      <div style={{ ...mono, fontSize: 10, color: 'var(--faint)', marginBottom: 6 }}>{label}</div>
      <div style={{ ...display, fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
