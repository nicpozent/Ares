import { PageHeader, display, mono } from '../components/ui'

interface Metric { k: string; v: string; s: string; trend: string; good: boolean }
interface Cat { label: string; pct: number; c: string }

const METRICS: Metric[] = [
  { k: 'MTTA', v: '2m', s: 'acknowledge', trend: '↓ 18%', good: true },
  { k: 'MTT-Assemble', v: '6m', s: 'responders', trend: '↓ 30%', good: true },
  { k: 'MTT-Identify', v: '9m', s: 'probable cause', trend: '↓ 22%', good: true },
  { k: 'MTTM', v: '27m', s: 'mitigate', trend: '↓ 12%', good: true },
  { k: 'MTTR', v: '58m', s: 'recover', trend: '↓ 9%', good: true },
  { k: 'MTT-RCA', v: '1.2d', s: 'RCA published', trend: '↓ 61%', good: true },
  { k: 'Repeat rate', v: '14%', s: 'recurring', trend: '↑ 3%', good: false },
  { k: 'Change-caused', v: '42%', s: 'from change', trend: 'flat', good: false },
]

const CATS: Cat[] = [
  { label: 'Payment', pct: 38, c: 'var(--accent)' },
  { label: 'Identity', pct: 22, c: 'var(--brandA)' },
  { label: 'E-commerce', pct: 18, c: 'var(--brandB)' },
  { label: 'ERP', pct: 14, c: 'var(--warn)' },
  { label: 'Network', pct: 8, c: 'var(--faint)' },
]

const PATTERN = 'Four of the previous seven payment incidents involved certificate-lifecycle failures across independently managed infrastructure.'

function trendColor(m: Metric): string {
  if (m.good) return 'var(--ok)'
  if (m.trend === 'flat') return 'var(--faint)'
  return 'var(--warn)'
}

export function Analytics() {
  return (
    <section style={{ maxWidth: 1120, margin: '0 auto' }}>
      <PageHeader kicker="RESILIENCE ANALYTICS" title="How we respond, over time" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {METRICS.map((m) => (
          <div key={m.k} style={{ borderRadius: 13, border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: 0.6, color: 'var(--faint)', marginBottom: 8 }}>{m.k}</div>
            <div style={{ ...display, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{m.v}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ fontSize: 10.5, color: 'var(--faint)' }}>{m.s}</span>
              <span style={{ ...mono, fontSize: 11, fontWeight: 600, color: trendColor(m) }}>{m.trend}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 18, alignItems: 'start' }}>
        <div style={{ borderRadius: 16, border: '1px solid var(--accent)', background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, var(--panel)), var(--panel))', padding: 24 }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: 1, color: 'var(--accent)', fontWeight: 600, marginBottom: 14 }}>◆ PATTERN DETECTED</div>
          <div style={{ ...display, fontSize: 21, fontWeight: 600, lineHeight: 1.4 }}>{PATTERN}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 16, lineHeight: 1.5 }}>ARES recommends a tenant-wide certificate-lifecycle control — more valuable than any single-incident summary.</div>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid var(--line)', background: 'var(--panel)', padding: 22 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18 }}>Incidents by service</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {CATS.map((c) => (
              <div key={c.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                  <span>{c.label}</span>
                  <span style={{ ...mono, color: 'var(--muted)' }}>{c.pct}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 6, background: 'var(--panel2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, background: c.c, width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
