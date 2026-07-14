import { useStore } from '../store'
import { Btn, PageHeader, Avatar, mono } from '../components/ui'

export function Admin() {
  const s = useStore()
  return (
    <section style={{ maxWidth: 1180, margin: '0 auto' }}>
      <PageHeader kicker="◆ ADMINISTER · ENTRA ID → ARES" title="Access & Roles"
        right={<div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="soft" onClick={() => s.reloadDirectory()}>↻ Sync from Entra</Btn>
          <Btn variant="primary" onClick={s.openImport}>+ Import from Entra</Btn>
        </div>} />

      <div style={{ ...mono, fontSize: 11.5, color: 'var(--faint)', marginBottom: 18 }}>
        {s.config?.entraConfigured ? 'Entra ID connected · Graph import enabled.' : 'Entra ID not configured — running on the local directory. Set credentials to enable Graph import.'}
        {' · '}{s.directory.length} principals mapped.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, alignItems: 'start' }}>
        {/* directory + role chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--faint)' }}>DIRECTORY PRINCIPALS · click a role chip to map/unmap</div>
            <button onClick={() => s.addPrincipal({ name: 'New principal', email: 'name@birgma.com', type: 'user', roles: ['viewer'] })} style={{ border: 'none', background: 'transparent', color: 'var(--brandA)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add mapping</button>
          </div>
          {s.directory.map((u) => (
            <div key={u.id} style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel)', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Avatar name={u.name} type={u.type} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.name} <span style={{ ...mono, fontSize: 9.5, color: 'var(--faint)', marginLeft: 6 }}>{u.type === 'group' ? 'GROUP' : 'USER'}</span>{u.entraSource && <span style={{ ...mono, fontSize: 9.5, color: 'var(--brandA)', marginLeft: 6 }}>via {u.entraSource}</span>}</div>
                  <div style={{ ...mono, fontSize: 11, color: 'var(--faint)' }}>{u.email}</div>
                </div>
                <button className="aresbtn" onClick={() => s.deletePrincipal(u.id)} title="Remove" style={{ border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {s.roles.map((r) => {
                  const on = u.roles.includes(r.key)
                  const isAdmin = r.key === 'admin'
                  return (
                    <button key={r.key} className="aresbtn" onClick={() => s.toggleRole(u.id, r.key)}
                      style={{ cursor: 'pointer', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        border: `1px solid ${on ? (isAdmin ? 'var(--warn)' : 'var(--brandA)') : 'var(--line)'}`,
                        background: on ? (isAdmin ? 'color-mix(in srgb,var(--warn) 22%,transparent)' : 'color-mix(in srgb,var(--brandA) 20%,transparent)') : 'transparent',
                        color: on ? (isAdmin ? 'var(--warn)' : 'var(--brandA)') : 'var(--faint)' }}>
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* role catalogue */}
        <div style={{ position: 'sticky', top: 90 }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--faint)', marginBottom: 10 }}>ROLE CATALOGUE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {s.roles.map((r) => {
              const count = s.directory.filter((u) => u.roles.includes(r.key)).length
              const isPlat = r.kind === 'platform'
              return (
                <div key={r.key} style={{ borderRadius: 11, border: '1px solid var(--line)', background: 'var(--panel)', padding: '11px 13px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{r.glyph}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{r.label}</span>
                      <span style={{ ...mono, fontSize: 8.5, fontWeight: 600, padding: '2px 6px', borderRadius: 5, background: isPlat ? 'color-mix(in srgb,var(--warn) 18%,transparent)' : 'color-mix(in srgb,var(--brandA) 18%,transparent)', color: isPlat ? 'var(--warn)' : 'var(--brandA)' }}>{isPlat ? 'PLATFORM' : 'INCIDENT'}</span>
                      <span style={{ marginLeft: 'auto', ...mono, fontSize: 11, color: 'var(--faint)' }}>{count}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.45, marginTop: 3 }}>{r.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
