import React from 'react'

// Inline-style shorthand (matches the prototype's inline-style approach).
export type S = React.CSSProperties

export const card: S = { borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }
export const mono: S = { fontFamily: "'IBM Plex Mono',monospace" }
export const display: S = { fontFamily: "'Space Grotesk',sans-serif" }

export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...mono, fontSize: 11, letterSpacing: 1.2, color: 'var(--faint)', fontWeight: 600, marginBottom: 8 }}>
      <span style={{ width: 14, height: 1, background: 'var(--brandA)' }} />
      {children}
    </div>
  )
}

export function PageHeader({ kicker, title, right }: { kicker: string; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <Kicker>{kicker}</Kicker>
        <h1 style={{ ...display, fontSize: 29, fontWeight: 700, letterSpacing: -0.5 }}>{title}</h1>
      </div>
      {right}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'ghost', style, title }: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'hot' | 'ghost' | 'soft'; style?: S; title?: string
}) {
  const base: S = { cursor: 'pointer', borderRadius: 10, fontSize: 13, fontWeight: 600, padding: '10px 16px', border: '1px solid var(--line)' }
  const v: Record<string, S> = {
    primary: { border: 'none', background: 'var(--grad)', color: '#fff', boxShadow: '0 10px 24px -10px var(--brandA)' },
    hot: { border: 'none', background: 'var(--grad-hot)', color: '#fff', boxShadow: '0 8px 20px -8px var(--accent)' },
    ghost: { background: 'var(--panel)', color: 'var(--text)' },
    soft: { background: 'var(--chip)', color: 'var(--text)' },
  }
  return <button className="aresbtn" title={title} onClick={onClick} style={{ ...base, ...v[variant], ...style }}>{children}</button>
}

/** contentEditable field that commits on blur. */
export function Editable({ value, onCommit, style }: { value: string; onCommit: (v: string) => void; style?: S }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => { const v = e.currentTarget.innerText.trim(); if (v !== value) onCommit(v) }}
      style={style}
    >
      {value}
    </div>
  )
}

export function Modal({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  return (
    <div className="aresov" onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,20,.62)', backdropFilter: 'blur(3px)', zIndex: 60, display: 'grid', placeItems: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width, maxWidth: '100%', maxHeight: '86vh', overflowY: 'auto', borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>{title}</h3>
          <button className="aresbtn" onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--faint)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  )
}

export function Avatar({ name, type, size = 32 }: { name: string; type?: string; size?: number }) {
  const init = (name || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <span style={{ width: size, height: size, borderRadius: type === 'group' ? 9 : '50%', background: type === 'group' ? 'var(--brandB)' : 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center', ...mono, fontSize: size * 0.34, fontWeight: 600, flexShrink: 0 }}>{init}</span>
  )
}
