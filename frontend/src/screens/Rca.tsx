import { useStore } from '../store'
import { sevBg } from '../lib/severity'
import { PageHeader, mono } from '../components/ui'

const rcaFactors = [
  { k: 'Trigger', v: 'Certificate rotation in CHG-18442 shipped an intermediate CA the gateway did not trust.', tone: '#ff3d6e' },
  { k: 'Root cause', v: 'Deployment pipeline had no TLS chain-validation gate against the gateway trust store.', tone: '#ff3d6e' },
  { k: 'Contributing factor', v: 'Change executed outside a canary window; rolled to all Swedish stores at once.', tone: '#ffb020' },
  { k: 'Detection gap', v: 'No synthetic payment ran post-deploy; first signal came from live decline rate.', tone: '#ffb020' },
  { k: 'Response factor', v: 'Clear rollback owner and pre-approved runbook enabled recovery in 58 minutes.', tone: '#37d39b' },
  { k: 'Recovery factor', v: 'Rollback of CHG-18442 restored the trusted chain; success rate returned to baseline.', tone: '#37d39b' },
]

const fiveWhys = [
  'Why did payments fail? The gateway rejected the store service TLS handshake.',
  'Why rejected? CHG-18442 deployed an untrusted intermediate certificate.',
  'Why untrusted cert deployed? No validation against the gateway trust store existed.',
  'Why no validation? The pipeline had no TLS chain-health gate.',
  'Why no gate? Certificate lifecycle was treated as config, not a release-blocking control.',
]

const rcaEvidence = [
  'CHG-18442 completed at 21:39:17',
  'TLS failures began at 21:41:06',
  'No comparable failures in prior 24h',
  'Service recovered after rollback at 22:37:40',
]

const rcaStructure = [
  'Executive summary', 'Incident classification', 'Business & customer impact', 'Affected services & dependencies',
  'Detection & escalation', 'Detailed timeline', 'Technical analysis', 'Trigger', 'Root cause', 'Contributing factors',
  'Control failures', 'Response effectiveness', 'Recovery actions', 'Five Whys', 'Corrective & preventive actions',
  'Owners & deadlines', 'Residual risk', 'Lessons learned', 'Supporting evidence', 'Approval & closure',
]

export function Rca() {
  const s = useStore()
  const inc = s.active()
  if (!inc) return null

  const hypos = inc.hypotheses
  const topH = hypos.length
    ? (hypos.find((h) => h.status === 'Confirmed') || hypos.find((h) => h.status === 'Probable') || hypos[0])
    : null
  const confirmed = !!topH && topH.status === 'Confirmed'
  const confidenceLabel = confirmed ? 'High confidence' : topH ? 'Moderate confidence' : 'Unvalidated'
  const confidenceColor = confirmed ? 'var(--ok)' : topH ? 'var(--warn)' : 'var(--faint)'
  const finding = topH
    ? `${topH.title} — the certificate deployment (CHG-18442) triggered the payment outage.`
    : 'The certificate deployment (CHG-18442) triggered the payment outage.'

  return (
    <section style={{ maxWidth: 1120, margin: '0 auto' }}>
      <PageHeader kicker="AI-DRAFTED ROOT CAUSE ANALYSIS" title="RCA report"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 20, background: 'color-mix(in srgb, var(--warn) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 40%, transparent)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warn)' }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>Draft — causality pending human validation</span>
          </div>
        } />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ ...mono, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 7, color: '#fff', background: sevBg(inc.sev) }}>{inc.sev}</span>
        <span style={{ ...mono, fontSize: 11.5, color: 'var(--brandA)', fontWeight: 600 }}>{inc.id}</span>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{inc.title || 'Untitled incident'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Causal breakdown */}
          <div style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Causal breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {rcaFactors.map((f) => (
                <div key={f.k} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 14, alignItems: 'start', paddingBottom: 11, borderBottom: '1px solid var(--line)' }}>
                  <div style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: f.tone, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: f.tone }} />{f.k}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>{f.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence-backed finding */}
          <div style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--brandB) 16%, var(--panel)), var(--panel))', padding: 20 }}>
            <div style={{ ...mono, fontSize: 10.5, letterSpacing: 0.8, color: 'var(--brandA)', fontWeight: 600, marginBottom: 14 }}>EVIDENCE-BACKED FINDING</div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, marginBottom: 14 }}>{finding}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
              {rcaEvidence.map((ev) => (
                <div key={ev} style={{ display: 'flex', gap: 9, fontSize: 12.5, color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--brandA)', ...mono }}>›</span>
                  <span style={{ ...mono, fontSize: 12 }}>{ev}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              <div>
                <div style={{ ...mono, fontSize: 9.5, color: 'var(--faint)', marginBottom: 4 }}>CONFIDENCE</div>
                <div style={{ fontWeight: 700, color: confidenceColor, fontSize: 14 }}>{confidenceLabel}</div>
              </div>
              <div>
                <div style={{ ...mono, fontSize: 9.5, color: 'var(--faint)', marginBottom: 4 }}>LEADING HYPOTHESIS</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{topH ? `${topH.status} · ${topH.owner || 'Unassigned'}` : 'None recorded'}</div>
              </div>
            </div>
          </div>

          {/* Five Whys */}
          <div style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 15 }}>Five Whys</h3>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {fiveWhys.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 13, padding: '9px 0' }}>
                  <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--grad)', color: '#fff', display: 'grid', placeItems: 'center', ...mono, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report structure */}
        <div style={{ position: 'sticky', top: 90 }}>
          <div style={{ borderRadius: 15, border: '1px solid var(--line)', background: 'var(--panel)', padding: '18px 20px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Report structure</h3>
            <p style={{ fontSize: 11.5, color: 'var(--faint)', marginBottom: 14 }}>Auto-assembled · 20 sections</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {rcaStructure.map((t, i) => (
                <div key={t} style={{ display: 'flex', gap: 10, padding: '5px 0', fontSize: 12, alignItems: 'baseline' }}>
                  <span style={{ ...mono, fontSize: 10, color: 'var(--faint)', width: 18, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  <span style={{ color: 'var(--muted)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
