# ARES — Incident Command Platform

A major-incident management platform for **Birgma / Biltema**, co-branded, built on a Microsoft-centric stack (Teams, Entra ID, Azure). This repo/doc is a build spec derived from a working HTML prototype (`ARES Incident Command.dc.html`). Screenshots of every screen are in `screenshots/`.

> **Product name:** ARES (Greek god of war). Mark is a Corinthian helmet with a crimson crest.
> **Anchor scenario used throughout:** `INC-2026-0047 — Payment failures in Sweden` (payment-gateway TLS cert change broke card payments in 38 stores).

---

## 1. What ARES is

An incident-response cockpit that lives where responders already work (Microsoft Teams) and adds an intelligence + governance layer on top of existing ITSM/monitoring. It covers the full lifecycle: **declare → respond → communicate → resolve → learn**, plus platform readiness (on-call, runbooks, SLOs, status page) and administration (Entra ID role mapping).

Target users: **IT operations & incident responders**. Primary buyer context: internal platform for a multi-entity retail group.

---

## 2. Tech stack (recommended for the real build)

The prototype is a single self-contained HTML file. For a production build:

- **Frontend:** React + TypeScript, Vite. Component-per-view. State via Zustand or Redux Toolkit.
- **Backend:** Azure — Durable Functions / Logic Apps for incident orchestration; Event Hubs for the event stream; Azure OpenAI + AI Search for the scribe/RCA; Cosmos DB or SQL for records.
- **Integrations:** Microsoft Graph (Teams channels/meetings, mail), Entra ID (auth + RBAC), ServiceNow/Jira (ITSM), Datadog/Sentinel/Azure Monitor (signals), Azure DevOps/GitHub (change/deploy).
- **Auth:** Entra ID (OIDC). App roles gate everything (see §6).

Keep the LLM **tool-scoped**: it drafts and correlates but has **no production write access**; comms and remediation require human approval.

---

## 3. Design system

**Fonts**
- Display/headings: **Space Grotesk** (700).
- Body/UI: **IBM Plex Sans** (400–700).
- Mono/labels/timestamps: **IBM Plex Mono**.

**Brand palette**
- Biltema blue `#117AC0`
- Birgma navy `#1B3B9B`
- Birgma crimson `#DE0A45` (doubles as SEV-1 / alert / accent)
- Success `#37D39B` · Warning `#FFB020`

**Three themes** (a header toggle switches live; token sets):
| Token | Command (dark, default) | Daylight (light) | Carbon (near-black) |
|---|---|---|---|
| app bg | `#0b1330→#080d1e` gradient | `#eef2fb→#e4ebf7` | `#0a0c12→#060709` |
| panel | `#111c42` | `#ffffff` | `#101319` |
| text | `#eef2ff` | `#111a3a` | `#f2f4f8` |
| brandA | `#2E93E6` | `#117AC0` | `#3aa0ff` |
| accent | `#ff3d6e` | `#DE0A45` | `#ff2d5e` |

Full token maps for all three themes are in the prototype's `themes` object — lift them verbatim.

**Conventions**
- Cards: `border-radius: 14–16px`, 1px hairline borders (`--line`), soft shadows on elevated cards.
- Gradients used deliberately: primary `--grad` (navy→blue) for CTAs/marks; `--grad-hot` (crimson→orange) for destructive/urgent.
- Severity colors: SEV-1 crimson→orange, SEV-2 amber, SEV-3 blue.
- Inline editing: click-to-edit fields show a subtle underline on hover, accent underline on focus.

**Logos** (in `assets/`): `birgma.png` / `biltema.png` (color, for light themes) and `birgma-white.png` / `biltema-white.png` (for dark themes). Co-brand lockup = Birgma + divider + Biltema, side by side in the header. The theme controls which pair shows.

---

## 4. App shell

- **Left sidebar:** ARES helmet mark + wordmark; nav grouped into **Operate**, **Resolve & Learn**, **Readiness**, and (admin only) **Administer**; user chip + admin-mode toggle at the bottom.
- **Header:** active incident id + title, live status pill, clock, theme toggle (Command/Daylight/Carbon), co-brand lockup.
- Nav items show live count badges (open incidents, evidence count, unapproved comms, pending pages, at-risk SLOs).
- Only the active view mounts.

---

## 5. Screens (see `screenshots/`)

**OPERATE**
1. **Incidents** (`01-incidents.png`) — register of all incidents. Cards show sev, status, impact, service, country, IC, evidence count. Actions: Open, Edit, Delete (confirm modal). "+ Declare incident".
2. **War Room** (`02-warroom.png`) — the cockpit. Teams-style **Adaptive Card** (status/started/duration, editable impact, role slots, current hypothesis, quick actions); **AI Scribe live feed**; **pinned dashboard** (metrics + sparkline); **connected context**; **Related incidents** card (link/child/duplicate).
3. **Declare / Edit** (`03-declare.png`) — form + **deterministic severity engine**. Title/impact/service/country + 7 dimensions (business, geo, users, data, duration, critical service, regulatory). Severity is **rule-computed, not AI** — shows the deciding rule. Same form edits existing incidents.
4. **Timeline · Scribe** (`04-timeline-scribe.png`) — reconstructed truth. "Where the scribe feeds from" panel (8 sources). Every event editable: text, timestamp, reclassify type; add/delete.
5. **Hypotheses** (`05-hypotheses.png`) — register with evidence-for / evidence-against, owner, status (Suggested→Investigating→Probable→Confirmed→Rejected, click to advance). Add/edit/remove.
6. **Evidence** (`06-evidence.png`) — chain of evidence: logs, metrics, screenshots, config/change, links, files. Timestamped, editable, feeds RCA.

**RESOLVE & LEARN**
7. **Communications** (`07-communications.png`) — three audience drafts (Technical / Executive / Service desk). Human-approval gating for SEV-1. Per-card **Release** → email composer.
8. **Email composer** (`08-email-composer.png`) — **Birgma house style** (see §7). Editable subject/body, per-recipient **To / Bcc** from Entra directory.
9. **RCA Report** (`09-rca.png`) — AI-drafted. Causal breakdown (trigger/root cause/contributing/detection/response/recovery), evidence-backed finding + confidence, Five Whys, 20-section structure.
10. **Corrective Actions** (`10-corrective-actions.png`) — governance. Priority (P1–P3) + status (Open/In progress/Done), **weak-action flagging** by AI. Add/edit/delete. Syncs to Jira/ADO/ServiceNow.
11. **Resilience Analytics** (`11-analytics.png`) — MTTA/MTTR/etc., pattern detection, incidents-by-service.

**READINESS**
12. **On-call & Paging** (`12-oncall-paging.png`) — team rotations (primary/secondary/upcoming), SEV-based **escalation policies**, live **pages you acknowledge** to stop escalation. "Page now".
13. **Runbooks** (`13-runbooks.png`) — playbooks with tickable steps + progress %, "Attach to incident" (logs to timeline). Editable.
14. **Status Page** (`14-status-page.png`) — customer-facing. Component states (operational/degraded/outage, click to cycle), publish toggle, editable incident updates with state (investigating→identified→monitoring→resolved).
15. **SLOs & Budget** (`15-slo-budget.png`) — objective vs. error-budget burn per service; Healthy/Watch/At-risk by budget consumed; one-click "Declare incident" from a breach.

**PLATFORM & ADMIN**
16. **Platform & Security** (`16-platform-security.png`) — reference architecture, security/governance controls, build-vs-buy, roadmap (MVP vs Enterprise).
17. **Access & Roles** (admin) (`17-admin-access-roles.png`) — **Entra ID → ARES role mapping** for users and groups (click role chips), sync-from-Entra, role catalogue with counts.
18. **Assign role modal** (`18-assign-role-modal.png`) — per-incident role assignment; candidates are **filtered to people mapped to that role in Entra** (eligible vs other-directory).

**THEMES**
- `19-daylight-theme.png`, `20-carbon-theme.png` — same screens in the other two themes.

---

## 6. Roles (RBAC)

**Platform roles:** Administrator, Responder, Stakeholder (read-only).
**Incident roles:** Incident Commander, Deputy Commander, Technical Lead, Operations Lead, Communications Lead, Scribe, Service Owner, Subject-Matter Expert, Security Lead, Customer Liaison, Executive Sponsor, Vendor Coordinator.

Roles are defined once (catalogue), mapped from Entra ID users/groups in **Admin › Access & Roles**, and those mappings drive the eligible candidates in each incident's role pickers. Administrator is required to see the Administer section (toggle in the prototype simulates this).

---

## 7. Email release — Birgma house template

Match the real Global IT notification format:

- **From:** `Global IT Communications <global.it.communications@birgma.com>`
- **Subject:** `Global IT Notification - <incident title> (<audience>) -- ACTION REQUIRED`
  - Suffix logic: SEV-1 → `-- ACTION REQUIRED`; lower sev → `-- FOR AWARENESS`; resolved → no suffix.
- **Body:** `Dear colleagues,` → the approved audience draft → `Current status: … . <next-update line>` → service-desk line (`birgmabiltema.sdpondemand.manageengine.eu`, reference the incident id) → `Kind regards, / Global IT Communications / Birgma / Biltema`.
- **Recipients:** distribution lists / groups default to **Bcc**; primary audience to **To**. Every recipient can be toggled To/Bcc.
- Optionally attach relevant KB articles (the real MFA notice attached `KB-10546 Enabling and Configuring MFA.pdf`).

---

## 8. Data model (entities)

- **Incident:** id, title, sev, status, started, duration, impact, serviceName, country, `sel` (7 severity dimensions), `assign` (role→userId), timeline[], hypos[], evidence[], actions[], comms{tech,exec,sd}.
- **Directory principal:** id, name, email, type (user|group), roles[] (Entra→ARES mapping).
- **Timeline event:** id, t, type (CHANGE/ALERT/INCIDENT/ROSTER/MESSAGE/SCRIBE/DECISION/MILESTONE), src, text.
- **Hypothesis:** id, title, forE, againstE, owner, status.
- **Evidence:** id, kind (log/metric/screenshot/config/link/file), title, source, ref, by, t, note.
- **Action:** id, desc, owner, due, prio, status, weak (bool).
- **On-call:** schedules[{team, rotation, shifts[{who, label, state}]}]; escalation[{name, steps[{after, target, via}]}]; pages[{target, via, state, at, ackAt}].
- **Runbook:** id, title, service, trigger, owner, steps[{text, done}].
- **Status page:** published, url, components[{name, state}], updates[{t, state, title, body}].
- **SLO:** service, objective, target, current, budgetUsed, window, burn.
- **Links:** incidentId → [{id, rel: related|child|duplicate}].

Severity is computed by an explicit rule function (see prototype `computeSev`) — reproduce exactly; do not delegate to the model.

---

## 9. Build order (suggested)

1. App shell + theming + nav + Entra auth.
2. Incident data model + Incidents list + Declare (severity engine) + CRUD.
3. War Room + timeline + inline editing.
4. Hypotheses, Evidence, Actions.
5. Communications + email composer (house template) + Graph mail send.
6. RCA + Analytics.
7. Admin (Entra role mapping) → wire role pickers.
8. Readiness: on-call/paging, runbooks, status page, SLOs.
9. Platform/security page (mostly static reference).

The prototype `ARES Incident Command.dc.html` is the source of truth for exact copy, colors, spacing, and interaction behavior — open it alongside the screenshots.
