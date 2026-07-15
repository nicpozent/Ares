import type { View } from '../store'
import { Incidents } from './Incidents'
import { WarRoom } from './WarRoom'
import { Declare } from './Declare'
import { Timeline } from './Timeline'
import { Hypotheses } from './Hypotheses'
import { Evidence } from './Evidence'
import { Communications } from './Communications'
import { Rca } from './Rca'
import { Actions } from './Actions'
import { Analytics } from './Analytics'
import { Platform } from './Platform'
import { Oncall } from './Oncall'
import { Runbooks } from './Runbooks'
import { StatusPage } from './StatusPage'
import { Slo } from './Slo'
import { Admin } from './Admin'

export const screens: Record<View, () => JSX.Element | null> = {
  incidents: Incidents,
  warroom: WarRoom,
  declare: Declare,
  timeline: Timeline,
  hypotheses: Hypotheses,
  evidence: Evidence,
  comms: Communications,
  rca: Rca,
  actions: Actions,
  analytics: Analytics,
  platform: Platform,
  oncall: Oncall,
  runbooks: Runbooks,
  status: StatusPage,
  slo: Slo,
  admin: Admin,
}
