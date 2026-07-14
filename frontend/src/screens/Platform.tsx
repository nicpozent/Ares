import { PageHeader, mono } from '../components/ui'

interface Layer { t: string; s: string; w: string; grad: boolean }

const LAYERS: Layer[] = [
  { t: 'Major Incident Portal', s: 'React · Blazor', w: '62%', grad: true },
  { t: 'Teams App · Bot · Adaptive Cards', s: 'Teams SDK · Graph', w: '74%', grad: true },
  { t: 'Incident Orchestration & State Engine', s: 'Durable Functions · Logic Apps', w: '86%', grad: true },
  { t: 'Timeline · Workflow · Comms · RCA Engine', s: 'Event Hubs · Azure OpenAI · AI Search', w: '100%', grad: false },
  { t: 'Integration & Event Layer', s: 'Sentinel · Datadog · ServiceNow · Jira · Entra', w: '100%', grad: false },
  { t: 'Service & Dependency Knowledge Graph', s: 'Runbooks · Architecture · Previous incidents', w: '80%', grad: true },
]

const SEC_CONTROLS: string[] = [
  'Entra ID RBAC & PIM',
  'Incident-level authorization',
  'Ops / security incident separation',
  'Legal & HR restricted classes',
  'Immutable activity logging',
  'Tenant & legal-entity boundaries',
  'Private endpoints · CMK',
  'Prompt-injection controls',
  'Restricted transcript access',
  'Secret & PII redaction',
  'Human approval for comms & remediation',
  'No production write access for the LLM',
]

const BUY_LIST: string[] = [
  'Standard incident process',
  'Speed over deep customization',
  'Mature on-call needed now',
  'Limited internal dev capacity',
  'SaaS residency acceptable',
]

const BUILD_LIST: string[] = [
  'Complex legal-entity segregation',
  'Store / country / region impact models',
  'Custom security-incident confidentiality',
  'Many ITSM & monitoring environments',
  'Own the resilience knowledge graph',
]

export function Platform() {
  return (
    <section style={{ maxWidth: 1120, margin: '0 auto' }}>
      <PageHeader kicker="PLATFORM & SECURITY" title="Reference architecture & governance" />
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18, alignItems: 'start', marginBottom: 18 }}>
        <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Reference architecture</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            {LAYERS.map((l) => (
              <div key={l.t} style={{ width: l.w, borderRadius: 10, padding: '12px 16px', border: '1px solid var(--line)', background: l.grad ? 'var(--grad)' : 'var(--panel2)', textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: l.grad ? '#fff' : 'var(--text)' }}>{l.t}</div>
                <div style={{ ...mono, fontSize: 10, color: l.grad ? 'rgba(255,255,255,.78)' : 'var(--faint)', marginTop: 3 }}>{l.s}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Security & governance controls</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px' }}>
            {SEC_CONTROLS.map((c) => (
              <div key={c} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', alignItems: 'flex-start', lineHeight: 1.4 }}>
                <span style={{ color: 'var(--ok)', flexShrink: 0 }}>✓</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 10, background: 'var(--panel2)', border: '1px dashed var(--line)', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
            The model acts only through explicitly authorized tools. It never holds broad infrastructure credentials.
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <div style={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--panel)', padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--brandA)' }}>Buy when…</div>
          {BUY_LIST.map((b) => (
            <div key={b} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', padding: '4px 0', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--faint)' }}>›</span>{b}
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--panel)', padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>Build when…</div>
          {BUILD_LIST.map((b) => (
            <div key={b} style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--muted)', padding: '4px 0', lineHeight: 1.4 }}>
              <span style={{ color: 'var(--faint)' }}>›</span>{b}
            </div>
          ))}
        </div>
        <div style={{ borderRadius: 14, border: '1px solid var(--line)', background: 'linear-gradient(150deg, color-mix(in srgb, var(--brandB) 20%, var(--panel)), var(--panel))', padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Recommendation · Hybrid</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.55 }}>Keep ITSM as system of record. Use Teams as the interface. Build the intelligence, correlation & RCA layer. Reuse existing monitoring, paging & security.</div>
        </div>
      </div>
    </section>
  )
}
