import { useStore } from '../../store'
import { Modal, Avatar, Btn } from '../../components/ui'
import type { DirectoryPrincipal } from '../../types'

export function AssignModal() {
  const s = useStore()
  const inc = s.active()
  const slot = s.assignSlot!
  const role = s.roles.find((r) => r.key === slot)
  const assignedId = inc?.assign?.[slot] ?? null
  const eligible = s.directory.filter((u) => u.roles.includes(slot))
  const others = s.directory.filter((u) => !u.roles.includes(slot))

  const Row = ({ u }: { u: DirectoryPrincipal }) => {
    const sel = u.id === assignedId
    return (
      <button className="aresbtn" onClick={() => s.assign(slot, u.id)}
        style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', textAlign: 'left', cursor: 'pointer', padding: '10px 12px', borderRadius: 10, border: `1px solid ${sel ? 'var(--ok)' : 'var(--line)'}`, background: sel ? 'color-mix(in srgb,var(--ok) 12%,transparent)' : 'var(--panel2)' }}>
        <Avatar name={u.name} type={u.type} size={30} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{u.name}</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--faint)', fontFamily: "'IBM Plex Mono',monospace" }}>{u.email}</span>
        </span>
        {sel && <span style={{ color: 'var(--ok)', fontSize: 14 }}>✓</span>}
      </button>
    )
  }

  return (
    <Modal title={`Assign — ${role?.label ?? slot}`} onClose={s.closeModal} width={560}>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.5 }}>
        Candidates are filtered to principals mapped to <strong style={{ color: 'var(--text)' }}>{role?.label}</strong> in Entra ID.
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 0.6, color: 'var(--faint)', marginBottom: 8 }}>ELIGIBLE ({eligible.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {eligible.length ? eligible.map((u) => <Row key={u.id} u={u} />) : <div style={{ color: 'var(--faint)', fontSize: 13 }}>No one mapped to this role yet.</div>}
      </div>
      {others.length > 0 && (
        <>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, letterSpacing: 0.6, color: 'var(--faint)', marginBottom: 8 }}>OTHER DIRECTORY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{others.map((u) => <Row key={u.id} u={u} />)}</div>
        </>
      )}
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={() => s.assign(slot, null)}>Clear assignment</Btn>
      </div>
    </Modal>
  )
}
