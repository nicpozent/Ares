import { useStore } from '../../store'
import { Modal, Avatar, Btn, mono } from '../../components/ui'

export function EmailModal() {
  const s = useStore()
  const d = s.emailDraft!
  const toCount = Object.values(d.recips).filter((v) => v === 'to').length
  const bccCount = Object.values(d.recips).filter((v) => v === 'bcc').length

  return (
    <Modal title="Release email — Birgma house style" onClose={s.closeModal} width={720}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ ...mono, fontSize: 11, color: 'var(--faint)' }}>
          FROM · {s.config?.mailSender ?? 'global.it.communications@birgma.com'}
          {!s.config?.entraConfigured && <span style={{ color: 'var(--warn)' }}> · Graph not configured — will record without dispatch</span>}
        </div>
        <div>
          <div style={{ ...mono, fontSize: 11, color: 'var(--faint)', marginBottom: 6 }}>SUBJECT</div>
          <input className="aresin" value={d.subject} onChange={(e) => s.setEmailField('subject', e.target.value)}
            style={{ width: '100%', background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13.5 }} />
        </div>
        <div>
          <div style={{ ...mono, fontSize: 11, color: 'var(--faint)', marginBottom: 6 }}>BODY</div>
          <textarea className="aresin" value={d.body} onChange={(e) => s.setEmailField('body', e.target.value)}
            style={{ width: '100%', minHeight: 200, background: 'var(--panel2)', border: '1px solid var(--line)', borderRadius: 9, padding: '10px 12px', color: 'var(--text)', fontSize: 13, lineHeight: 1.55, resize: 'vertical', whiteSpace: 'pre-wrap' }} />
        </div>
        <div>
          <div style={{ ...mono, fontSize: 11, color: 'var(--faint)', marginBottom: 8 }}>
            RECIPIENTS · {toCount} To · {bccCount} Bcc · distribution lists default to Bcc
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {s.directory.map((u) => {
              const m = d.recips[u.id]
              return (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 9, border: `1px solid ${m ? 'var(--brandA)' : 'var(--line)'}`, background: m ? 'color-mix(in srgb,var(--brandA) 8%,transparent)' : 'var(--panel2)' }}>
                  <Avatar name={u.name} type={u.type} size={26} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600 }}>{u.name}</span>
                    <span style={{ display: 'block', fontSize: 10.5, color: 'var(--faint)', ...mono }}>{u.email}</span>
                  </span>
                  <button className="aresbtn" onClick={() => s.setRecip(u.id, 'to')}
                    style={{ cursor: 'pointer', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, border: `1px solid ${m === 'to' ? 'transparent' : 'var(--line)'}`, background: m === 'to' ? 'var(--grad)' : 'transparent', color: m === 'to' ? '#fff' : 'var(--muted)' }}>To</button>
                  <button className="aresbtn" onClick={() => s.setRecip(u.id, 'bcc')}
                    style={{ cursor: 'pointer', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 600, border: `1px solid ${m === 'bcc' ? 'transparent' : 'var(--line)'}`, background: m === 'bcc' ? 'var(--brandB)' : 'transparent', color: m === 'bcc' ? '#fff' : 'var(--muted)' }}>Bcc</button>
                </div>
              )
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <Btn onClick={s.closeModal}>Cancel</Btn>
          <Btn variant="primary" onClick={s.sendEmail} style={{ opacity: s.busy ? 0.6 : 1 }}>
            {s.config?.entraConfigured ? 'Release via Graph →' : 'Record release →'}
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
