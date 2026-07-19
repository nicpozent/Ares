# ARES — Candidate Requirements & Architecture Documentation Set

> **Status:** Draft for review · **Nature:** Documentation only — *no build/implementation
> is authorized by this set.* These documents describe **candidate** requirements and a
> **candidate** target architecture for the agentic-AI evolution of ARES, plus a compliance
> analysis. Where a capability does not exist in the shipped app, it is marked
> **[CANDIDATE]**.

This index defines the document map, the identifier conventions, and the shared glossary so
every downstream document (requirements, TOGAF artifacts, compliance analyses) cross-
references consistently.

Deployment context assumed throughout: **on-prem/containerized ARES**, Microsoft-centric
(Entra ID, Microsoft Graph, Teams, M365 Copilot licensing), PostgreSQL, model hosted
**in-tenant** (Azure OpenAI). Operating jurisdictions: **Switzerland** and the **Nordics**
(Sweden, Norway, Finland, Denmark). Co-branded for **Birgma / Biltema** (retail group).

---

## 1. Document map

| Doc | File | Purpose |
|---|---|---|
| 00 · Index | `docs/candidate/00-index.md` | Conventions, glossary, ID scheme (this file) |
| 01 · Candidate Requirements | `docs/candidate/01-candidate-requirements.md` | Exhaustive FRs, NFRs, user stories, acceptance criteria, assumptions, constraints, traceability |
| 10 · TOGAF Architecture | `docs/candidate/10-togaf-architecture.md` | ADM Phases A–D + Requirements Management: vision, business, data, application, technology; catalogs, matrices, diagrams, principles |
| 20 · ISO/IEC 27001 & 42001 | `docs/candidate/20-iso27001-42001.md` | ISMS (27001:2022 Annex A) + AI Management System (42001:2023) control mapping + gap analysis |
| 21 · MITRE ATT&CK & ATLAS + Zero Trust | `docs/candidate/21-mitre-zerotrust.md` | Adversary technique mapping (ATT&CK enterprise + ATLAS for the AI layer) + Zero Trust (NIST SP 800-207 / MS pillars) maturity |
| 22 · Privacy & AI Regulation | `docs/candidate/22-privacy-ai-regulation.md` | GDPR, Swiss nFADP/revDSG, EU AI Act, NIS2, DORA/CRA relevance, Nordic jurisdictional matrix, DPIA outline |
| Annex · Agent Design & Threat Model | `docs/agent-design-and-threat-model.md` | Prior design/threat-model note (referenced as the design annex) |

---

## 2. Identifier conventions

Stable IDs make requirements traceable across architecture and compliance. Format
`PREFIX-AREA-NNN` (zero-padded, gaps allowed for later insertion).

**Functional requirements — `FR-AREA-NNN`.** Areas:
`INC` incident lifecycle · `INV` investigate/hypotheses/evidence · `CRD` coordinate
(roles/paging/actions) · `TML` timeline & AI scribe · `COM` communications & release ·
`RCA` root-cause analysis · `AGT` agent orchestration & guardrails ·
`ADM` admin/RBAC/Entra mapping · `INT` integrations (`INT-TEAMS`, `INT-SDP`,
`INT-GRAPH`, `INT-SIG` signals).

**Non-functional requirements — `NFR-AREA-NNN`.** Areas:
`SEC` security · `PRV` privacy/data protection · `AI` responsible-AI/governance ·
`AVL` availability/resilience · `PERF` performance · `USE` usability/accessibility ·
`OBS` observability/audit · `PORT` portability/deployment/residency · `COMP` compliance.

**Other:** `US-AREA-NNN` user stories · `EPIC-NNN` epics · `PRIN-NNN` architecture
principles · `CON-NNN` constraints · `ASM-NNN` assumptions · `RISK-NNN` risks ·
`STK-NNN` stakeholders · `ABB/SBB-NNN` architecture/solution building blocks.

**Compliance controls** reference framework-native IDs and map back to `FR/NFR` IDs:
ISO 27001 Annex A `A.5.x`; ISO 42001 clauses/`Annex A` & `Annex B`; MITRE ATT&CK `T####`;
MITRE ATLAS `AML.T####`; NIST ZT tenets; GDPR `Art. n`; EU AI Act `Art. n`; nFADP `Art. n`.

---

## 3. Capability → requirement-area seed catalog

The five requested agent capabilities, plus supporting areas. Doc 01 expands each into
individual FRs/NFRs/user stories; docs 10/20/21/22 reference these IDs.

| Capability / area | Areas | Summary |
|---|---|---|
| **Investigate** | `INV` | Correlate signals; propose/refine hypotheses with evidence-for/against + confidence; surface related incidents from RCA history |
| **Coordinate** | `CRD` | Propose role assignments (Entra-eligible), next actions, page targets; drive the response tempo |
| **Maintain timeline** | `TML` | Live AI scribe: ingest → dedupe → classify → write timeline entries with citations; fully editable |
| **Draft communications** | `COM` | Audience-tailored drafts (tech/exec/service-desk) in the Birgma house style; human-approval-gated release via Graph |
| **Draft RCA** | `RCA` | Causal breakdown, Five Whys, evidence-backed finding + confidence; verifier pass; human-approved before publish |
| Incident core | `INC` | Declare/edit/resolve; deterministic severity; CRUD of children |
| Agent platform | `AGT` | Orchestration, tool scoping (read/propose/gated), proposal/review lane, adversarial verifier, kill switch, budget/rate limits |
| Admin / access | `ADM` | Entra→ARES role mapping, import, per-action RBAC |
| Integrations | `INT-*` | Teams bot + group-chat (RSC), M365 Copilot agent, ServiceDesk Plus Cloud, Graph signal ingestion |

---

## 4. Non-negotiable design invariants (govern all requirements)

1. The LLM is **out of the act plane** — irreversible/outbound actions are executed by
   deterministic code triggered by an authorized human, never by the model.
2. **Human approval** for anything outbound (communications, paging, remediation).
3. **Severity is rule-computed**, never model-inferred.
4. **Per-action authorization on verified identity**, not chat/channel membership.
5. **All ingested content (chat, tickets, logs) is data, never instructions.**
6. Everything **audited, reversible, least-privilege, in-tenant**.

---

## 5. Stakeholders (referenced as `STK-NNN`)

`STK-01` Incident Commander · `STK-02` Deputy/Responders · `STK-03` Communications Lead ·
`STK-04` Service Owner/SME · `STK-05` Security Lead / CISO · `STK-06` Data Protection
Officer (DPO) · `STK-07` Platform Administrator · `STK-08` Executive Sponsor ·
`STK-09` Service Desk (SDP) · `STK-10` Vendor Coordinator · `STK-11` Internal Audit /
Compliance · `STK-12` End users / customers (impact recipients) · `STK-13` Regulators /
supervisory authorities.

---

## 6. Glossary

- **AIMS** — AI Management System (ISO/IEC 42001).
- **ISMS** — Information Security Management System (ISO/IEC 27001).
- **Act plane / read plane** — separation between understanding content (model may read)
  and executing actions (deterministic, human-triggered).
- **Proposal-first** — the agent proposes; a human commits.
- **RSC** — Teams Resource-Specific Consent (per-chat/-team scoped Graph access).
- **SDP** — ManageEngine ServiceDesk Plus Cloud (EU DC).
- **nFADP / revDSG** — revised Swiss Federal Act on Data Protection (in force 2023).
- **DPIA** — Data Protection Impact Assessment.
- **Bridge chat** — the single Teams group chat per incident containing all responders/roles.

---

## 7. Conventions for downstream docs

- Requirements use MoSCoW priority (**M**ust/**S**hould/**C**ould/**W**on't-yet) and cite
  the invariant(s) they uphold.
- Anything not in the shipped app is tagged **[CANDIDATE]**; anything already shipped is
  tagged **[SHIPPED]** for honest gap analysis.
- Diagrams use Mermaid. Catalogs/matrices use Markdown tables.
- Compliance findings use: **Met / Partially met / Gap / N/A**, each with the mapped
  `FR/NFR` ID and a remediation note.
