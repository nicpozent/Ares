import { useStore } from '../store'
import { PageHeader, mono, display } from '../components/ui'

export function Slo() {
  const s = useStore()

  return (
    <section style={{ maxWidth: 1080, margin: '0 auto' }}>
      <PageHeader kicker="SLOs & ERROR BUDGET" title="Service objectives" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {s.slos.map((slo) => {
          const breach = slo.budgetUsed >= 90
          const warn = slo.budgetUsed >= 60
          const barColor = slo.budgetUsed > 90 ? 'var(--accent)' : slo.budgetUsed > 60 ? 'var(--warn)' : 'var(--ok)'
          const curColor = slo.current < slo.target ? 'var(--warn)' : 'var(--ok)'
          const burnNum = parseFloat(slo.burn)
          const burnColor = burnNum >= 2 ? 'var(--accent)' : burnNum >= 1 ? 'var(--warn)' : 'var(--muted)'
          const stateLabel = breach ? 'AT RISK' : warn ? 'WATCH' : 'HEALTHY'
          const stateColor = breach ? 'var(--accent)' : warn ? 'var(--warn)' : 'var(--ok)'

          const onDeclare = () => s.newIncidentFromDraft({
            title: slo.objective + ' breach — ' + slo.service,
            serviceName: slo.service,
            impact: 'SLO ' + slo.objective + ' at ' + slo.current + '% vs target ' + slo.target + '% (error budget ' + slo.budgetUsed + '% consumed).',
            sel: { business: 'Degraded checkout', geo: 'Global', users: 'Customers', data: 'No data impact', duration: '15–60 min', service: 'E-commerce', regulatory: 'None' },
          })

          return (
            <div key={slo.id} style={{ borderRadius: 14, border: '1px solid var(--line)', background: 'var(--panel)', padding: '17px 20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 18, alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{slo.objective}</div>
                  <div style={{ ...mono, fontSize: 10.5, color: 'var(--faint)', marginTop: 2 }}>{slo.service} · {slo.window}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9.5, color: 'var(--faint)', marginBottom: 3 }}>CURRENT / TARGET</div>
                  <div style={{ ...display, fontSize: 17, fontWeight: 700 }}>
                    <span style={{ color: curColor }}>{slo.current}%</span>{' '}
                    <span style={{ color: 'var(--faint)', fontSize: 12 }}>/ {slo.target}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9.5, color: 'var(--faint)', marginBottom: 3 }}>BURN RATE</div>
                  <div style={{ ...display, fontSize: 17, fontWeight: 700, color: burnColor }}>{slo.burn}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ ...mono, fontSize: 10.5, fontWeight: 600, color: stateColor }}>{stateLabel}</span>
                  <button className="aresbtn" onClick={onDeclare}
                    style={{ border: '1px solid var(--line)', background: 'var(--panel2)', color: 'var(--text)', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, padding: '7px 13px', borderRadius: 8 }}>
                    Declare incident
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ ...mono, fontSize: 10, color: 'var(--faint)', width: 96, flexShrink: 0 }}>BUDGET {slo.budgetUsed}%</span>
                <div style={{ flex: 1, height: 8, borderRadius: 6, background: 'var(--panel2)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 6, background: barColor, width: Math.min(100, slo.budgetUsed) + '%' }} />
                </div>
              </div>
            </div>
          )
        })}
        {!s.slos.length && <div style={{ textAlign: 'center', padding: 60, color: 'var(--faint)', fontSize: 14 }}>No SLOs configured.</div>}
      </div>
    </section>
  )
}
