import { useStore } from '../store'
import { Btn, PageHeader, Editable, mono } from '../components/ui'

const META: Record<string, { aud: string; to: string }> = {
  tech: { aud: 'Technical', to: 'Responders & engineering' },
  exec: { aud: 'Executive', to: 'Leadership & business owners' },
  sd: { aud: 'Service desk', to: 'Stores & front-line support' },
}

export function Communications() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return null
  const keys = ['tech', 'exec', 'sd'] as const

  return (
    <section style={{ maxWidth: 1180, margin: '0 auto' }}>
      <PageHeader kicker="STAKEHOLDER COMMUNICATIONS" title="Audience-tailored drafts" />
      {s.lastEmail && <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--ok)', background: 'color-mix(in srgb,var(--ok) 10%,transparent)', fontSize: 13 }}>{s.lastEmail}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(330px,1fr))', gap: 16 }}>
        {keys.map((k) => {
          const c = inc.comms[k]
          return (
            <div key={k} style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{META[k].aud}</div>
                <div style={{ ...mono, fontSize: 10.5, color: 'var(--faint)', marginTop: 2 }}>{META[k].to}</div>
              </div>
              <div style={{ padding: '16px 18px', flex: 1 }}>
                <Editable value={c.body} onCommit={(v) => s.editComms(k, v)} style={{ fontSize: 13.5, lineHeight: 1.6, minHeight: 120 }} />
              </div>
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)' }}>
                <div style={{ ...mono, fontSize: 10, fontWeight: 600, letterSpacing: 0.5, color: c.approved ? 'var(--ok)' : 'var(--warn)', marginBottom: 10 }}>
                  {c.approved ? 'APPROVED · READY TO RELEASE' : 'AWAITING HUMAN APPROVAL'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn onClick={() => s.approveComms(k)} style={{ flex: 1, border: 'none', background: c.approved ? 'var(--ok)' : 'var(--grad)', color: '#fff' }}>{c.approved ? '✓ Approved' : 'Approve'}</Btn>
                  <Btn variant="soft" onClick={() => s.openEmail(k)} title="Open email composer">Release ✉</Btn>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p style={{ marginTop: 18, fontSize: 12.5, color: 'var(--faint)', lineHeight: 1.6, maxWidth: 760 }}>
        SEV-1 releases require human approval before dispatch. Releasing opens the Birgma house-style composer;
        the email is sent from <span style={{ ...mono, color: 'var(--muted)' }}>{s.config?.mailSender}</span> via Microsoft Graph.
      </p>
    </section>
  )
}
