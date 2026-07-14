import { useEffect, useState } from 'react'
import { useStore } from '../../store'
import { api } from '../../api/client'
import { Modal, Avatar, Btn, mono } from '../../components/ui'
import type { GraphApp, GraphGroup, GraphPrincipal } from '../../types'

type Tab = 'groups' | 'apps'

export function ImportModal() {
  const s = useStore()
  const configured = s.config?.entraConfigured ?? false
  const [tab, setTab] = useState<Tab>('groups')
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<GraphGroup[]>([])
  const [apps, setApps] = useState<GraphApp[]>([])
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [sourceName, setSourceName] = useState('')
  const [principals, setPrincipals] = useState<GraphPrincipal[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [roleKeys, setRoleKeys] = useState<string[]>(['responder'])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const search = async () => {
    if (!configured) return
    setLoading(true); setErr(null)
    try {
      if (tab === 'groups') setGroups(await api.entraGroups(query || undefined))
      else setApps(await api.entraApps(query || undefined))
    } catch (e: any) { setErr(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { if (configured) search() /* eslint-disable-next-line */ }, [tab])

  const pickSource = async (id: string, name: string) => {
    setSourceId(id); setSourceName(name); setPrincipals([]); setSelected({}); setResult(null)
    setLoading(true); setErr(null)
    try {
      const ps = tab === 'groups' ? await api.entraGroupMembers(id) : await api.entraAppAssignments(id)
      setPrincipals(ps)
      setSelected(Object.fromEntries(ps.map((p) => [p.entraId, true])))
    } catch (e: any) { setErr(e.message) } finally { setLoading(false) }
  }

  const doImport = async () => {
    const chosen = principals.filter((p) => selected[p.entraId])
    if (!chosen.length) return
    setLoading(true); setErr(null)
    try {
      const res = await api.entraImport(chosen.map((p) => ({ ...p, source: sourceName, roles: roleKeys })))
      await s.reloadDirectory()
      setResult(`Imported ${res.total} principal(s): ${res.added} new, ${res.updated} updated.`)
    } catch (e: any) { setErr(e.message) } finally { setLoading(false) }
  }

  const selCount = Object.values(selected).filter(Boolean).length

  return (
    <Modal title="Import from Entra ID" onClose={s.closeModal} width={760}>
      {!configured ? (
        <div style={{ padding: '10px 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
          Microsoft Graph is not configured on the API. Set the Entra tenant / client id / client secret
          (see <span style={{ ...mono, color: 'var(--text)' }}>.env</span>) and grant the app the
          <strong style={{ color: 'var(--text)' }}> Group.Read.All</strong>,
          <strong style={{ color: 'var(--text)' }}> Directory.Read.All</strong> and
          <strong style={{ color: 'var(--text)' }}> Application.Read.All</strong> application permissions,
          then restart the API to enable directory import.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['groups', 'apps'] as Tab[]).map((t) => (
              <button key={t} className="aresbtn" onClick={() => { setTab(t); setSourceId(null); setPrincipals([]) }}
                style={{ cursor: 'pointer', borderRadius: 8, padding: '7px 14px', fontSize: 12.5, fontWeight: 600, border: '1px solid var(--line)', background: tab === t ? 'var(--grad)' : 'transparent', color: tab === t ? '#fff' : 'var(--muted)' }}>
                {t === 'groups' ? 'Groups' : 'Enterprise apps'}
              </button>
            ))}
          </div>

          {/* search */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="aresin" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder={tab === 'groups' ? 'Search groups by name…' : 'Search enterprise apps by name…'}
              style={{ flex: 1, background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 9, padding: '9px 12px', color: 'var(--text)', fontSize: 13 }} />
            <Btn variant="soft" onClick={search}>Search</Btn>
          </div>

          {err && <div style={{ color: 'var(--accent)', fontSize: 12.5 }}>{err}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* sources */}
            <div>
              <div style={{ ...mono, fontSize: 10, color: 'var(--faint)', marginBottom: 8 }}>{tab === 'groups' ? 'GROUPS' : 'ENTERPRISE APPS'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {(tab === 'groups' ? groups.map((g) => ({ id: g.id, name: g.displayName, sub: g.mail || g.description || '' }))
                  : apps.map((a) => ({ id: a.id, name: a.displayName, sub: a.appId || '' }))).map((row) => (
                  <button key={row.id} className="aresbtn" onClick={() => pickSource(row.id, row.name)}
                    style={{ textAlign: 'left', cursor: 'pointer', padding: '8px 11px', borderRadius: 9, border: `1px solid ${sourceId === row.id ? 'var(--brandA)' : 'var(--line)'}`, background: sourceId === row.id ? 'color-mix(in srgb,var(--brandA) 8%,transparent)' : 'var(--panel2)' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{row.name}</div>
                    {row.sub && <div style={{ ...mono, fontSize: 10, color: 'var(--faint)' }}>{row.sub}</div>}
                  </button>
                ))}
                {loading && !principals.length && <div style={{ color: 'var(--faint)', fontSize: 12 }}>Loading…</div>}
              </div>
            </div>

            {/* principals */}
            <div>
              <div style={{ ...mono, fontSize: 10, color: 'var(--faint)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>{sourceName ? `MEMBERS · ${sourceName}` : 'SELECT A SOURCE'}</span>
                {principals.length > 0 && <button onClick={() => { const all = selCount !== principals.length; setSelected(Object.fromEntries(principals.map((p) => [p.entraId, all]))) }} style={{ border: 'none', background: 'transparent', color: 'var(--brandA)', cursor: 'pointer', ...mono, fontSize: 10 }}>{selCount === principals.length ? 'none' : 'all'}</button>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
                {principals.map((p) => (
                  <label key={p.entraId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, border: '1px solid var(--line)', background: 'var(--panel2)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!selected[p.entraId]} onChange={(e) => setSelected((v) => ({ ...v, [p.entraId]: e.target.checked }))} />
                    <Avatar name={p.name} type={p.type} size={26} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ display: 'block', fontSize: 10.5, color: 'var(--faint)', ...mono }}>{p.email || '(no email)'}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* roles to assign on import */}
          <div>
            <div style={{ ...mono, fontSize: 10, color: 'var(--faint)', marginBottom: 8 }}>ASSIGN ARES ROLE(S) ON IMPORT</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {s.roles.map((r) => {
                const on = roleKeys.includes(r.key)
                return (
                  <button key={r.key} className="aresbtn" onClick={() => setRoleKeys((ks) => on ? ks.filter((k) => k !== r.key) : [...ks, r.key])}
                    style={{ cursor: 'pointer', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, border: `1px solid ${on ? 'var(--brandA)' : 'var(--line)'}`, background: on ? 'color-mix(in srgb,var(--brandA) 18%,transparent)' : 'transparent', color: on ? 'var(--brandA)' : 'var(--faint)' }}>
                    {r.label}
                  </button>
                )
              })}
            </div>
          </div>

          {result && <div style={{ color: 'var(--ok)', fontSize: 13, fontWeight: 600 }}>{result}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn onClick={s.closeModal}>Close</Btn>
            <Btn variant="primary" onClick={doImport} style={{ opacity: loading || !selCount ? 0.6 : 1 }}>Import {selCount || ''} principal(s) →</Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}
