import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, type View } from './store'
import { applyTheme } from './theme/themes'
import { statusColor } from './lib/severity'
import { demoAuth, entraConfigured, signIn, activeAccount } from './auth/msal'
import { Helmet } from './components/Helmet'
import { screens } from './screens/registry'
import { AssignModal } from './screens/modals/AssignModal'
import { EmailModal } from './screens/modals/EmailModal'
import { DeleteModal } from './screens/modals/DeleteModal'
import { ImportModal } from './screens/modals/ImportModal'
import { mono } from './components/ui'

interface NavItem { id: View; label: string; glyph: string; badge?: string; hot?: boolean }

export function App() {
  const s = useStore()
  const rootRef = useRef<HTMLDivElement>(null)
  const [needAuth, setNeedAuth] = useState(entraConfigured && !demoAuth && !activeAccount())
  const [clock, setClock] = useState('')

  useEffect(() => { if (!needAuth) s.init() /* eslint-disable-next-line */ }, [needAuth])
  useEffect(() => { if (rootRef.current) applyTheme(rootRef.current, s.theme) }, [s.theme, s.ready])
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' CET')
    tick(); const h = setInterval(tick, 1000); return () => clearInterval(h)
  }, [])

  const inc = s.active()

  const nav = useMemo(() => {
    const openInc = s.incidents.length
    const hypoActive = inc ? inc.hypotheses.filter((h) => h.status !== 'Rejected' && h.status !== 'Confirmed').length : 0
    const openActions = inc ? inc.actions.filter((a) => !a.weak && a.status !== 'Done').length : 0
    const unappr = inc ? [inc.comms.tech, inc.comms.exec, inc.comms.sd].filter((c) => !c.approved).length : 0
    const pendingPages = s.oncall ? s.oncall.pages.filter((p) => p.state !== 'Acknowledged').length : 0
    const breaching = s.slos.filter((x) => x.current < x.target).length
    const operate: NavItem[] = [
      { id: 'incidents', label: 'Incidents', glyph: '▦', badge: String(openInc) },
      { id: 'warroom', label: 'War Room', glyph: '▣', badge: 'LIVE', hot: true },
      { id: 'declare', label: 'Declare', glyph: '＋' },
      { id: 'timeline', label: 'Timeline · Scribe', glyph: '≡' },
      { id: 'hypotheses', label: 'Hypotheses', glyph: '⑂', badge: hypoActive ? String(hypoActive) : undefined },
      { id: 'evidence', label: 'Evidence', glyph: '❖', badge: inc?.evidence.length ? String(inc.evidence.length) : undefined },
    ]
    const resolve: NavItem[] = [
      { id: 'comms', label: 'Communications', glyph: '✉', badge: unappr ? String(unappr) : undefined },
      { id: 'rca', label: 'RCA Report', glyph: '◈' },
      { id: 'actions', label: 'Corrective Actions', glyph: '☑', badge: openActions ? String(openActions) : undefined },
      { id: 'analytics', label: 'Resilience Analytics', glyph: '◔' },
      { id: 'platform', label: 'Platform & Security', glyph: '⬡' },
    ]
    const readiness: NavItem[] = [
      { id: 'oncall', label: 'On-call & Paging', glyph: '☎', badge: pendingPages ? String(pendingPages) : undefined, hot: true },
      { id: 'runbooks', label: 'Runbooks', glyph: '▤' },
      { id: 'status', label: 'Status Page', glyph: '◉', badge: s.statusPage && !s.statusPage.published ? 'DRAFT' : undefined },
      { id: 'slo', label: 'SLOs & Budget', glyph: '◔', badge: breaching ? String(breaching) : undefined, hot: true },
    ]
    return { operate, resolve, readiness }
  }, [s.incidents, inc, s.oncall, s.slos, s.statusPage])

  if (needAuth) {
    return (
      <div ref={rootRef} style={rootStyle}>
        <div style={{ margin: 'auto', textAlign: 'center', display: 'grid', gap: 18, placeItems: 'center' }}>
          <Helmet size={64} />
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 34, fontWeight: 700 }}>ARES</div>
            <div style={{ ...mono, fontSize: 11, letterSpacing: 1.6, color: 'var(--faint)' }}>INCIDENT COMMAND</div>
          </div>
          <button className="aresbtn" onClick={async () => { await signIn(); setNeedAuth(false) }}
            style={{ border: 'none', background: 'var(--grad)', color: '#fff', cursor: 'pointer', padding: '12px 26px', borderRadius: 11, fontSize: 14, fontWeight: 600 }}>
            Sign in with Microsoft Entra ID
          </button>
        </div>
      </div>
    )
  }

  if (!s.ready) {
    return <div ref={rootRef} style={rootStyle}><div style={{ margin: 'auto', color: 'var(--muted)' }}>Loading ARES…</div></div>
  }

  const Screen = screens[s.view] ?? screens.incidents

  return (
    <div ref={rootRef} style={rootStyle}>
      {/* SIDEBAR */}
      <aside style={{ width: 250, flexShrink: 0, background: 'var(--shell)', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ filter: 'drop-shadow(0 6px 12px rgba(46,147,230,.45))', flexShrink: 0 }}><Helmet size={44} /></div>
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 23, letterSpacing: 0.5, lineHeight: 1, background: 'linear-gradient(120deg,#8fd0ff,#7f9dff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>ARES</div>
            <div style={{ ...mono, fontSize: 9.5, letterSpacing: 1.6, color: 'var(--faint)', fontWeight: 600, marginTop: 4 }}>INCIDENT COMMAND</div>
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavGroup title="OPERATE" items={nav.operate} />
          <NavGroup title="RESOLVE & LEARN" items={nav.resolve} />
          <NavGroup title="READINESS" items={nav.readiness} />
          {s.isAdmin && (
            <>
              <div style={{ ...mono, fontSize: 10, letterSpacing: 1.4, color: 'var(--warn)', fontWeight: 600, padding: '16px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}><span>◆</span>ADMINISTER</div>
              <NavButton item={{ id: 'admin', label: 'Access & Roles', glyph: '◆' }} />
            </>
          )}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--grad)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 12, color: '#fff', ...mono }}>{initialsOfMe()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meName()}</div>
            <div style={{ fontSize: 10.5, color: 'var(--faint)' }}>{s.isAdmin ? 'Administrator · Incident Commander' : 'Incident Commander'}</div>
          </div>
          <button className="aresbtn" onClick={s.toggleAdmin} title={s.isAdmin ? 'Admin mode ON' : 'Admin mode OFF'}
            style={{ border: '1px solid var(--line)', background: s.isAdmin ? 'color-mix(in srgb,var(--warn) 20%,transparent)' : 'var(--chip)', color: s.isAdmin ? 'var(--warn)' : 'var(--muted)', cursor: 'pointer', width: 30, height: 30, borderRadius: 8, fontSize: 13 }}>◆</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(12px)', background: 'color-mix(in srgb, var(--shell) 82%, transparent)', borderBottom: '1px solid var(--line)', padding: '13px 26px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ ...mono, fontSize: 12, color: 'var(--brandA)', fontWeight: 600 }}>{inc?.id ?? '—'}</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--faint)' }} />
              <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inc?.title || 'No incident'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 20, background: 'var(--chip)', border: '1px solid var(--line)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: inc ? statusColor(inc.status) : 'var(--faint)', animation: 'arespulse 1.4s infinite' }} />
            <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, letterSpacing: 0.5 }}>{inc?.status ?? '—'}</span>
          </div>
          <div style={{ ...mono, fontSize: 13, fontWeight: 600, padding: '5px 12px', borderRadius: 8, background: 'var(--panel2)', border: '1px solid var(--line)' }}>{clock}</div>
          <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 11, background: 'var(--panel2)', border: '1px solid var(--line)' }}>
            {([['command', 'Command', '▤'], ['daylight', 'Daylight', '☀'], ['carbon', 'Carbon', '◑']] as const).map(([id, label, glyph]) => {
              const a = s.theme === id
              return <button key={id} className="aresbtn" onClick={() => s.setTheme(id)} title={`${label} style`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, background: a ? 'var(--grad)' : 'transparent', color: a ? '#fff' : 'var(--muted)' }}>
                <span>{glyph}</span>{label}
              </button>
            })}
          </div>
          <CoBrand />
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '26px 28px 60px' }}>
          {s.error && <div style={{ maxWidth: 1180, margin: '0 auto 16px', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--accent)', background: 'color-mix(in srgb,var(--accent) 10%,transparent)', color: 'var(--text)', fontSize: 13 }}>{s.error}</div>}
          <div data-view={s.view}><Screen /></div>
        </div>
      </main>

      {s.modal === 'assign' && <AssignModal />}
      {s.modal === 'email' && <EmailModal />}
      {s.modal === 'delete' && <DeleteModal />}
      {s.modal === 'import' && <ImportModal />}
    </div>
  )
}

function NavGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <>
      <div style={{ ...mono, fontSize: 10, letterSpacing: 1.4, color: 'var(--faint)', fontWeight: 600, padding: '16px 12px 6px' }}>{title}</div>
      {items.map((it) => <NavButton key={it.id} item={it} />)}
    </>
  )
}

function NavButton({ item }: { item: NavItem }) {
  const { view, setView } = useStore()
  const on = view === item.id
  return (
    <button className="aresnav" onClick={() => setView(item.id)}
      style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', padding: '9px 12px', borderRadius: 9, background: on ? 'var(--nav-on)' : 'transparent', color: on ? 'var(--text)' : 'var(--muted)', fontSize: 13.5, fontWeight: on ? 600 : 500 }}>
      <span style={{ width: 20, textAlign: 'center', ...mono, fontSize: 12, opacity: 0.85 }}>{item.glyph}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.badge && <span style={{ ...mono, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: item.hot ? 'var(--grad-hot)' : 'var(--chip)', color: item.hot ? '#fff' : 'var(--muted)' }}>{item.badge}</span>}
    </button>
  )
}

function CoBrand() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <span style={{ display: 'var(--lk-dark)', alignItems: 'center', gap: 14 }}>
        <img src="/assets/birgma-white.png" alt="Birgma" style={{ height: 20, display: 'block', opacity: 0.95 }} />
        <span style={{ width: 1, height: 20, background: 'var(--line)' }} />
        <img src="/assets/biltema-white.png" alt="Biltema" style={{ height: 12.5, display: 'block', opacity: 0.95 }} />
      </span>
      <span style={{ display: 'var(--lk-light)', alignItems: 'center', gap: 14 }}>
        <img src="/assets/birgma.png" alt="Birgma" style={{ height: 20, display: 'block' }} />
        <span style={{ width: 1, height: 20, background: 'var(--line)' }} />
        <img src="/assets/biltema.png" alt="Biltema" style={{ height: 12.5, display: 'block' }} />
      </span>
    </div>
  )
}

function meName() { return activeAccount()?.name ?? 'Anna Svensson' }
function initialsOfMe() { return meName().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() }

const rootStyle: React.CSSProperties = {
  display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--app-bg)', color: 'var(--text)', fontFamily: "'IBM Plex Sans',sans-serif",
}
