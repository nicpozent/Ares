# 22 · Privacy & AI-Regulation Analysis

> **Status:** Draft for review · **Nature:** Documentation only. This document analyses the
> privacy and AI-regulatory posture of the **candidate** agentic evolution of ARES for a
> deployment operating in **Switzerland** and the **Nordics** (Sweden, Norway, Finland,
> Denmark) for the **Birgma / Biltema** retail group. It does not authorise a build.
>
> **⚠️ Not legal advice.** This is an engineering/architecture compliance *analysis*
> prepared to inform design and to brief counsel and the DPO (`STK-06`). It is **not a legal
> opinion** and creates no legal conclusion. Statutory citations are provided for
> orientation and may lag amendments, guidance, or case law. Applicability of every
> obligation below is **conditional on facts** (entity structure, headcount/turnover,
> data actually processed, contractual terms) that only Birgma's Legal/DPO function and
> qualified local counsel in each jurisdiction can confirm. Where an obligation is
> conditional, the **condition (the test)** is stated rather than a conclusion asserted.

**Cross-references:** ID conventions and deployment context per `00-index.md`; app and agent
behaviour per `CLAUDE.md` and `docs/agent-design-and-threat-model.md` (the "design annex").
Framework control mappings live in `20-iso27001-42001.md` (ISMS/AIMS) and
`21-mitre-zerotrust.md`; this document maps to those where relevant.

> **Note on FR/NFR IDs.** Doc `01-candidate-requirements.md` is the canonical owner of the
> individual requirement numbers. Where this document cites IDs (e.g. `NFR-PRV-001`), it uses
> the `00-index.md` area scheme and **proposes** the mapping target; final numbering is
> reconciled in doc 01. IDs are stable *area* references, not a claim that the requirement is
> already written.

---

## 0. Executive summary

- ARES processes **staff (employee) personal data** — directory principals, Entra sign-in /
  audit logs, Teams bridge-chat content, incident communications and approver identities —
  in the course of IT incident response. It is **not** a customer-facing profiling system,
  and it should be designed to **avoid** processing payment cardholder data.
- **Birgma is the controller** (it determines purposes/means for its staff data); Microsoft,
  ManageEngine/Zoho and the Azure OpenAI service act as **processors / sub-processors** under
  Art. 28 GDPR / Art. 9 nFADP data-processing agreements.
- The **most defensible GDPR lawful basis** is **legitimate interest (Art. 6(1)(f))** — IT/
  network security and incident response are a named legitimate interest (Recital 49) — with
  **legal obligation (Art. 6(1)(c))** available for specific security/breach duties. Because
  the agent ingests sign-in logs and chat, an **employee-monitoring** analysis and local
  labour-law consultation are required in each Nordic country.
- A **DPIA (GDPR Art. 35) is warranted** and a **Swiss impact assessment (nFADP Art. 22)**
  should be run in parallel: the processing combines *systematic monitoring of employees* and
  *new AI technology at scale* — two of the CNIL/EDPB/WP248 DPIA triggers.
- Under the **EU AI Act**, the ARES agent is **not a prohibited practice** and is best
  argued as **limited-risk** (a human-in-the-loop incident-response copilot with
  rule-computed severity), **not** an Annex III high-risk system — but the employment-context
  boundary is close enough that the classification must be documented and re-tested if the
  agent's role in role-assignment/task-allocation hardens. **Art. 50 transparency (the bot
  must disclose it is AI) applies regardless.**
- **NIS2**: general **retail is not a listed sector** in Annex I/II, so the group is likely
  **out of scope** — *conditional* on no in-scope subsidiary and the size test. State the
  test; do not assume.
- **DORA is very likely N/A** (Birgma is a retailer, not a financial entity); **CRA** likely
  N/A for internal-only software; **PCI DSS** applies **only if** ARES touches cardholder
  data — design so it does not.

---

## 1. Personal-data inventory & processing context

### 1.1 What ARES processes, and why

ARES exists to run major-incident response. The personal data it touches is **incidental to
operations and security**, not the product. The agent layer widens the ingestion surface
(sign-in/audit logs, chat), which is the main driver of the privacy analysis.

| Data set | Personal-data elements | Special category? | Source | Purpose | Retention driver |
|---|---|---|---|---|---|
| **Directory principals** | Name, work email, user/group id, ARES/Entra role mappings | No | Microsoft Graph / Entra ID (app-only import) | Role eligibility, assignment, recipient selection | Mirror of Entra; refresh on sync |
| **Entra sign-in logs** | UPN/user id, IP, timestamp, device, location, auth/MFA/Conditional-Access result | No (but behavioural / potentially location-revealing) | Graph `/auditLogs/signIns` (Entra P1) | Detect auth anomalies → propose incident | Minimise; short window |
| **Entra directory audit logs** | Actor id, target, change made, timestamp | No | Graph `/auditLogs/directoryAudits` | Correlate config/change to incidents | Minimise; short window |
| **Teams bridge-chat content** | Author id, message text, timestamps, possibly free-text PII pasted by responders | **Possibly** (users may paste anything) | Teams RSC `ChatMessage.Read.Chat`, scoped to the incident chat | Live scribe: timeline entries with citations | Tie to incident record |
| **Incident timeline & scribe entries** | Actor references, quoted content, derived summaries | Possibly | Derived from above | Reconstructed truth of the incident | Incident retention |
| **Incident communications** | Author/approver identity, recipient To/Bcc lists (staff/DL), draft & released body | No (staff contacts) | ARES comms + Graph mail | Notify stakeholders; audit the release | Incident + audit retention |
| **Approver / actor identities** | Verified Entra id of the person who approved/paged/declared/resolved | No | Signed Adaptive-Card actions; API auth | Accountability, non-repudiation | Append-only audit retention |
| **On-call / paging** | Who is on rotation, contact channel, ack times | No | Rosters, paging events | Escalation, acknowledgement | Operational |
| **RCA / RAG memory** | Historical incident text, which may embed the above | Possibly | pgvector over ARES RCA + history | Retrieve similar incidents | Incident retention |
| **SDP tickets** | Requester/agent identity, ticket text | Possibly | ManageEngine SDP Cloud (EU DC), Zoho OAuth | ITSM sync, inbound signal | SDP retention |
| **ServiceHealth signals** | Tenant-level health (minimal PII) | No | Graph `serviceAnnouncement` | Auto-open signal | Transient |

**Categories present:** identity/contact data, electronic-identification & authentication
data, communications content, employment/role data, behavioural/telemetry (sign-ins).
**Categories to keep out:** payment cardholder data (PCI — §6.2), and any special-category
data under Art. 9 GDPR (health, etc.). Sign-in **location/IP** and free-text chat are the
two elements that can inadvertently pull in sensitive content → the **redaction/PII filter
before the model** (design annex §3, STRIDE "Info disclosure") is a privacy control, not
just a security one.

### 1.2 Controller / processor mapping

| Party | Role | Basis / instrument |
|---|---|---|
| **Birgma (and Biltema group entities as joint/several controllers per entity)** | **Controller** — determines purposes & means for its staff data | Art. 4(7) GDPR / Art. 5(j) nFADP |
| **Microsoft (Azure, Microsoft 365, Graph, Teams, Azure OpenAI in-tenant)** | **Processor** (and sub-processor chain within Azure) | Microsoft Products & Services DPA (Art. 28 GDPR standard terms); Azure OpenAI data does **not** train foundation models and stays in-tenant |
| **ManageEngine / Zoho (ServiceDesk Plus Cloud, EU DC)** | **Processor** | Zoho DPA; EU DC keeps data in EU boundary |
| **Any external LLM provider** *(only if the "act bot" is not on Azure OpenAI in-tenant — open decision, annex §8)* | Would be a **processor**; changes transfer & AI-Act GPAI analysis | Requires DPA + transfer assessment before adoption |

> **Controller-vs-processor nuance.** Because ARES is deployed **in-tenant** and the model is
> **Azure OpenAI in-tenant**, there is **no controller-to-independent-controller** disclosure
> to a model vendor: Microsoft acts as a **processor** on Birgma's instructions and does not
> become a controller of incident content. This is a materially better privacy posture than
> sending data to a third-party model API and should be preserved as an invariant
> (`NFR-PORT`, in-tenant; `00-index.md` §4.6). If the open decision (annex §8) selects an
> external model, re-run the controller/processor and transfer analysis before adoption.

### 1.3 Records of Processing (ROPA) — GDPR Art. 30(1) style

This is a **controller-side ROPA extract** for the ARES processing activity. Birgma's DPO
maintains the authoritative register; this is the ARES contribution to it.

| Art. 30(1) field | Entry for "ARES incident response" |
|---|---|
| **(a) Controller & DPO** | Birgma (group controller) / group DPO (`STK-06`); per-entity controllers for Biltema country operations |
| **(b) Purposes** | Major-incident detection, coordination, timeline reconstruction, stakeholder communication, root-cause analysis, and post-incident learning; IT/network security |
| **(c) Categories of data subjects** | Employees & contractors (responders, on-call staff, approvers, message authors); internal recipients of communications |
| **(c) Categories of personal data** | Identity/contact, authentication & sign-in telemetry, role/employment, communications content, approver/actor identity, on-call contact |
| **(d) Categories of recipients** | Internal responders & stakeholders; processors (Microsoft, ManageEngine/Zoho); no routine disclosure to third parties |
| **(e) Third-country transfers** | None routine for Nordic data (Azure EU region + SDP EU DC = intra-EEA). CH↔EU flows handled under mutual adequacy (§3.3). Document any Azure region fallout |
| **(f) Retention periods** | Directory: mirror of Entra; sign-in/audit ingest: minimised short window; incident + audit records: per incident-retention policy; append-only audit: retained for accountability |
| **(g) Security measures (Art. 32)** | See §2.5 → `NFR-SEC-*`, `NFR-PRV-*`: in-tenant model, RSC scoping, least-privilege Graph, redaction before model, append-only audit, RBAC on verified identity, encryption, Key Vault secrets |

A parallel **Art. 30(2) processor record** is held by each processor. Birgma should obtain and
file the relevant DPA + sub-processor list for Microsoft and Zoho (`NFR-COMP`).

---

## 2. GDPR (Sweden, Finland, Denmark — EU; Norway — via the EEA)

**Territorial reach.** GDPR (Regulation (EU) 2016/679) applies directly in Sweden, Finland
and Denmark. **Norway** applies GDPR through the **EEA Agreement**, implemented by the
Norwegian **Personal Data Act 2018 (*personopplysningsloven*)** — treat Norway as
GDPR-equivalent for this analysis. **Switzerland** is **not** covered by GDPR (see §3); note
that GDPR could still reach a Swiss entity extraterritorially (Art. 3(2)) *if* it processed
EU/EEA data subjects' data in scope — for ARES's internal staff-data use, the cleaner model
is **nFADP for CH staff, GDPR/EEA for Nordic staff**.

### 2.1 Lawful bases (Art. 6)

| Basis | Where it fits ARES | Condition / caveat |
|---|---|---|
| **Art. 6(1)(f) legitimate interest** | **Primary** basis: ensuring the security of IT/networks and services, and incident response, is an explicit legitimate interest (**Recital 49**) | Requires a documented **Legitimate Interests Assessment (LIA)** — purpose / necessity / balancing — kept with the DPIA |
| **Art. 6(1)(c) legal obligation** | Specific security, breach-notification and record-keeping duties (NIS2 if in scope, sectoral security law) | Only for the specific obligation; not a blanket basis |
| **Art. 6(1)(b) contract** | Weak fit — processing is not "necessary to perform the employment contract" per se | Do not over-rely; prefer (f) |
| **Consent (Art. 6(1)(a))** | **Avoid** as the basis for employee monitoring — consent is rarely "freely given" in an employer/employee relationship (EDPB) | Not a sound basis here |

**Special categories (Art. 9).** ARES should **not** intentionally process Art. 9 data. If
free-text chat/logs incidentally contain it, the **redaction filter** and data-minimisation
are the mitigations; there is no Art. 9 condition being relied upon, which is itself a reason
to minimise aggressively.

**Employee-monitoring nuance (important).** Ingesting **sign-in logs and chat content** is a
form of workforce monitoring. Beyond the LIA, several Nordic regimes add **procedural**
duties that are *not* satisfied by GDPR alone:

| Country | Additional employee-monitoring / consultation duty (condition-stated) |
|---|---|
| **Sweden** | Co-determination consultation with unions under **MBL** may be triggered before introducing monitoring/control measures; IMY guidance on workplace monitoring |
| **Finland** | **Act on the Protection of Privacy in Working Life (759/2004)** restricts processing of employee data and requires **co-operation negotiations** (Co-operation Act) before introducing monitoring technology |
| **Norway** | **Working Environment Act** + control-measures regulation: employer must **discuss, inform and evaluate** control measures with employee representatives |
| **Denmark** | Monitoring generally lawful with notice/proportionality; collective-agreement duties may apply |
| **Switzerland** | Art. 6 revDSG proportionality + **Art. 26 OLT 3** ban on surveillance systems intended to monitor behaviour; monitoring must be justified by security/performance and not target behaviour |

→ **Action:** the DPO + local HR/labour counsel must clear the **monitoring** dimension per
country **before** enabling sign-in/chat ingestion (`NFR-PRV`, `NFR-COMP`).

### 2.2 Principles (Art. 5) → design hooks

| Principle | How ARES meets / must meet it |
|---|---|
| Lawfulness, fairness, transparency | LIA + employee privacy notice; **AI disclosure** (AI Act Art. 50) doubles as fairness/transparency |
| Purpose limitation | Data used only for incident response/security; RAG memory not repurposed |
| **Data minimisation** | Redaction before model; least-privilege Graph scopes; **RSC per-chat** not tenant-wide; short ingest windows |
| Accuracy | Human-editable timeline/hypotheses; citations; adversarial verifier on RCA |
| Storage limitation | Defined retention for ingest, incident, and audit records |
| Integrity & confidentiality | Art. 32 measures (§2.5) |
| **Accountability** | This document + DPIA + ROPA + audit trail; ISO 27701 optional (§6.4) |

### 2.3 Data-subject rights (Art. 12–22)

Data subjects are mostly **employees**. Handling notes:

- **Access (15), Rectification (16), Erasure (17):** ARES holds mirrored directory data and
  incident records. Erasure is **constrained** where the record is needed for
  security/legal-defence/audit integrity (Art. 17(3)(b)/(e)) — the **append-only audit** is
  retained on that basis; document the exemption rather than allowing deletion.
- **Objection (21):** because the basis is legitimate interest, subjects may object; the
  balancing test (compelling grounds: security, incident accountability) is the response.
- **Automated decision-making (22):** **Not engaged** — severity is **rule-computed**, and
  every outbound/irreversible action requires a **human decision** (invariants 1–3). This is
  a key GDPR *and* AI-Act argument: ARES does **not** make Art. 22 "solely automated"
  decisions with legal/significant effect.
- **Portability (20):** low relevance (no consent/contract-basis processing of the subject's
  own provided data at scale).

→ Maps to `FR-ADM` (directory), `NFR-OBS` (audit), `NFR-PRV` (rights workflow).

### 2.4 Records — Art. 30

See the ROPA in §1.3. Art. 30 applies to Birgma as controller; processors keep Art. 30(2)
records. (The <250-employee exemption of Art. 30(5) will **not** apply to a group of this
size and, in any case, does not apply where processing is not occasional and includes
systematic monitoring.)

### 2.5 Security of processing — Art. 32 → NFR mapping

| Art. 32 expectation | ARES control | ID |
|---|---|---|
| Pseudonymisation / minimisation | Redaction/PII filter before model; least-privilege scopes; RSC | `NFR-PRV-*`, `NFR-SEC-*` |
| Encryption | TLS in transit; at-rest encryption (PostgreSQL, Key Vault secrets) | `NFR-SEC-*` |
| Confidentiality/integrity/availability | RBAC on **verified identity**; append-only audit; in-tenant model (no egress); rate limits/kill switch | `NFR-SEC-*`, `NFR-OBS-*`, `NFR-AVL-*` |
| Restore availability | Backups/DR for PostgreSQL | `NFR-AVL-*` |
| Testing & evaluation | Red-team prompt-injection, pen-test bot endpoint/webhooks, replay eval harness | `NFR-SEC-*`, `NFR-AI-*` |

Detailed mapping to ISO 27001 Annex A lives in `20-iso27001-42001.md`.

### 2.6 Personal-data breach notification — Art. 33 / 34

- **Art. 33 (to supervisory authority):** notify the competent SA **without undue delay and,
  where feasible, within 72 hours** of becoming aware, unless the breach is unlikely to
  result in a risk to rights and freedoms.
- **Art. 34 (to data subjects):** notify affected individuals without undue delay when the
  breach is likely to result in a **high** risk.
- ARES is itself a breach-management tool; a breach **of ARES** (e.g. exfiltration of chat/PII
  via prompt injection or the public bot endpoint — annex §7 top risks) is a reportable event.
  Wire the 72h clock into the incident runbook and the SDP/ARES workflow. **One-stop-shop**:
  identify the **lead SA** via the group's main establishment for cross-border processing.

### 2.7 International transfers (Chapter V)

- **Nordic data:** Azure **EU region** + **SDP EU DC** → processing stays **intra-EEA**; **no
  Chapter V transfer** for the routine flows. Confirm the **specific Azure region** and that
  no support/telemetry routes data out of the EEA; if any sub-processor egress exists, cover
  it with **SCCs + a transfer impact assessment**.
- **Switzerland ↔ EU:** handled under mutual adequacy (§3.3) — not a "third country" problem
  in either direction for staff data. Still document the CH-entity flows in the ROPA.
- **Trigger to re-assess:** selecting an external (non-Azure-in-tenant) model, or any US-based
  sub-processor, reopens the transfer analysis (SCCs, EU-US Data Privacy Framework
  eligibility, TIA).

### 2.8 DPIA (Art. 35) — why one is warranted + outline

**A DPIA is warranted.** Art. 35(3) and the **WP248 / national SA blacklists** flag DPIAs for
(a) **systematic monitoring**, (b) processing on a **large scale**, (c) **innovative use of
new technology (AI)**, and (d) data processed in an **employment** context. ARES combines
**systematic monitoring of employees** *and* **new AI technology** — meeting **at least two**
criteria, which SAs treat as a strong DPIA trigger. Run it **before** enabling
sign-in/chat ingestion and the agent loop.

**DPIA structure (Art. 35(7)):**

1. **Systematic description** — purposes, data flows (per §1), the agent architecture
   (annex §3), the read/act separation, processors and transfers.
2. **Necessity & proportionality** — the LIA; why sign-in/chat ingestion is necessary;
   minimisation choices (RSC scope, redaction, short windows); alternatives considered.
3. **Risks to rights & freedoms** — over-collection; oversharing/PII leakage to the model or
   into a comm; wrongful attribution from a hallucinated timeline/RCA; monitoring chilling
   effect; unauthorised approval; breach of the public bot endpoint.
4. **Measures to mitigate** — invariants 1–6; redaction filter; RSC + least privilege;
   append-only audit; RBAC on verified identity; adversarial verifier + citations + human
   approval; kill switch/rate limits; retention limits.
5. **Residual risk & sign-off** — DPO opinion (`STK-06`); consult the SA under **Art. 36**
   *only if* high residual risk remains after mitigation.
6. **Review** — re-run on material change (new signal source, external model, expanded
   autonomy).

Maps to `NFR-PRV`, `NFR-AI`, `NFR-COMP`; the AI-specific risk items feed the AI Act risk
management (§4.4) and ISO 42001 AIMS (doc 20).

---

## 3. Switzerland — nFADP / revDSG (in force 1 Sep 2023)

The revised **Federal Act on Data Protection (nFADP / revDSG)**, with the Ordinance
(**DPO/OPDo**), governs Swiss staff data. It is **GDPR-adjacent** but not identical.

### 3.1 Key differences vs GDPR

| Topic | nFADP position | Contrast with GDPR |
|---|---|---|
| Scope | Protects **natural persons only** | GDPR also natural persons (nFADP dropped legal persons in the revision) |
| Lawful basis | **No general "legal basis" requirement** for private controllers; processing lawful unless it breaches principles/personality rights; justification needed if a data-subject objects or for sensitive data | GDPR requires an Art. 6 basis up-front |
| Sensitive data | Broadly similar categories; adds some | Comparable |
| DPIA | **Data-protection impact assessment (Art. 22)** required where high risk to personality/fundamental rights | Analogous to Art. 35; consult **FDPIC** if high residual risk |
| Records of processing | Required (Art. 12); SMEs <250 with low-risk processing partly exempt | Similar to Art. 30 |
| Breach notification | Notify **FDPIC** "**as soon as possible**" where **high risk** to data subject; notify subjects where needed for their protection | **No fixed 72h**; higher (high-risk) threshold; generally lighter than GDPR |
| Privacy by design/default | Explicitly required (Art. 7) | Art. 25 |
| DPO / data-protection advisor | **Optional** (a "data protection advisor" may be appointed; not mandatory) | GDPR Art. 37 mandatory in cases |
| Sanctions | **Fines on responsible natural persons** up to CHF 250,000 (criminal, on individuals — not turnover-based on the company) | GDPR administrative fines on the undertaking |

### 3.2 Controller duties for ARES (Swiss staff data)

- Observe **proportionality, purpose limitation, good faith, transparency** (Art. 6);
  respect **privacy by design/default** (Art. 7).
- Maintain a **register of processing activities** (Art. 12) — the §1.3 ROPA covers this.
- Run the **Art. 22 impact assessment** (the nFADP DPIA-equivalent) alongside the GDPR DPIA;
  a single combined assessment is acceptable if it addresses both frameworks.
- Put an **Art. 9 data-processing agreement** in place with processors (Microsoft, Zoho).
- Honour Swiss **data-subject rights** (access Art. 25, etc.).
- Respect **Art. 26 OLT 3** on workplace surveillance (see §2.1 monitoring row).

### 3.3 Transfer regime (CH ↔ EU)

- Switzerland maintains its own **adequacy list** (Federal Council); the **EU/EEA is
  recognised**, so **CH → EU** transfers need no extra safeguards.
- The EU recognises **Switzerland as adequate** (Commission decision), so **EU → CH**
  transfers are likewise unrestricted.
- Practical effect for ARES: **CH ↔ Nordic staff-data flows within the Azure EU/CH boundary
  need no SCCs**. (Azure offers Swiss regions; confirm which region hosts CH-entity data if
  Swiss data residency is a contractual requirement.) The **FDPIC** is the Swiss supervisory
  authority.

---

## 4. EU AI Act (Regulation (EU) 2024/1689)

### 4.1 Is ARES's agent a "prohibited practice" (Art. 5)? — No

The Art. 5 prohibitions cover manipulative/deceptive techniques, exploitation of
vulnerabilities, social scoring, untargeted facial-image scraping, **emotion recognition in
the workplace**, biometric categorisation of sensitive traits, certain predictive policing,
and real-time remote biometric ID by law enforcement. **ARES does none of these.** It
correlates operational signals and drafts text. It performs **no emotion recognition, no
biometrics, no social scoring**. → **Not prohibited.**

### 4.2 Is it "high-risk" (Annex III)? — Argued **No**, with the boundary stated

Annex III lists high-risk areas; the closest to ARES is **point 4, employment / workers'
management**: AI intended to be used for **recruitment**, or for **decisions affecting terms,
promotion, termination, task allocation based on individual behaviour, or monitoring and
evaluating performance**.

**Argument that ARES is _not_ high-risk:**

- ARES's purpose is **incident response**, not HR decision-making. It does not recruit,
  promote, terminate, or **evaluate performance**.
- Where it proposes **role assignments**, it **proposes to eligible candidates** and a
  **human commits** (invariant 2, proposal-first). Assignments are transient incident roles,
  not employment decisions with legal/significant effect.
- **Severity is rule-computed** (invariant 3) — the one "classification" that matters is
  deterministic, not an AI inference, so the Art. 22 GDPR / Annex III "automated evaluation"
  concern is not met.
- The **Art. 6(3) filter** (added in the final text) lets a system that would otherwise fall
  in Annex III be treated as **not high-risk** where it performs only a **narrow procedural
  task** / **improves a prior human activity** / **does not replace or influence human
  assessment without review** — ARES's copilot posture fits, *provided* it does not profile.
  Using Art. 6(3) requires the provider/deployer to **document the assessment and register**
  it — do this rather than merely assert.

**The boundary (state, don't hide it):** if the agent's role-assignment or task-allocation
proposals became de-facto binding, or if it began scoring/evaluating responders'
performance, the employment-context high-risk classification could attach. **Re-test the
classification** whenever autonomy or the HR-adjacency of the agent's outputs increases.
Document the classification decision (`NFR-AI`, feeds ISO 42001 doc 20).

### 4.3 Conclusion: **limited-risk with transparency obligations**

ARES is best characterised as a **limited-risk AI system** — an incident-response copilot
with human-in-the-loop control. That triggers **Art. 50 transparency**, and the general
good-practice obligations below that ARES should meet **regardless** of the final tier.

### 4.4 Obligations to meet regardless of tier → FR/NFR mapping

| Obligation | What ARES must do | ID |
|---|---|---|
| **Art. 50 transparency — disclose it is AI** | The Teams bot and Copilot agent must **clearly disclose they are AI** when interacting with responders; AI-generated drafts (comms/RCA/timeline) labelled as AI-assisted | `FR-AGT`, `FR-COM`, `FR-TML`, `NFR-AI` |
| **Human oversight** | Human approval for all outbound/irreversible actions; Accept/Edit/Reject on every proposal; kill switch | `FR-AGT` (invariants 1–2), `NFR-AI` |
| **Logging / record-keeping** | Append-only `agent_audit`; provenance tags on ingested content; log proposals, approvals, model calls | `NFR-OBS`, `FR-AGT` |
| **Risk management** | The DPIA AI-risk items (§2.8) + threat model (annex §7) maintained as a living AI risk register | `NFR-AI`, `NFR-SEC` |
| **Data governance** | Redaction before model; minimisation; RAG memory scoped to ARES history; eval harness for quality/bias | `NFR-PRV`, `NFR-AI` |
| **Accuracy / robustness** | Citations + adversarial verifier + confidence; deterministic severity; content-as-data (no prompt-injection execution) | `FR-AGT`, `FR-RCA`, `NFR-AI` |

If the deployer later opts into Art. 6(3), the **documentation & EU-database registration**
of that non-high-risk assessment is itself an obligation.

### 4.5 General-purpose AI (GPAI) considerations

ARES uses a **foundation model** (Azure OpenAI, in-tenant). Under the AI Act:

- **GPAI-model obligations fall on the _provider_ of the model** (OpenAI/Microsoft), not on
  Birgma as a **deployer**. Birgma's duty is to use the model within the provider's
  documented terms and to keep its own **deployer** transparency/oversight duties (§4.4).
- **Systemic-risk GPAI** obligations (Art. 55, for very large models) are the model provider's
  concern.
- **Action:** obtain and retain the provider's GPAI documentation / acceptable-use terms;
  confirm the in-tenant service's "**no training on your data**" commitment (Azure OpenAI) —
  this is both a GPAI-governance and a privacy point.

### 4.6 Timeline, extraterritorial reach, Switzerland

- **Phased application:** in force **1 Aug 2024**; **prohibited practices from 2 Feb 2025**;
  **GPAI obligations from 2 Aug 2025**; **Annex III high-risk from 2 Aug 2026**; certain
  Annex I high-risk from **2 Aug 2027**. Plan compliance to the tier ARES lands in; the
  **Art. 50 transparency** duty should be treated as effective on the high-risk milestone
  horizon and implemented early as good practice.
- **Extraterritorial reach (Art. 2):** the Act reaches providers/deployers established
  outside the EU where the **AI system's output is used in the EU**. For the Nordic
  deployment the Act **applies**.
- **Switzerland:** **not bound** by the AI Act (Switzerland is pursuing its own AI-regulation
  approach, oriented to the **Council of Europe AI Convention**, expected to lean on existing
  sectoral + data-protection law rather than an EU-Act clone). **But**: if a Swiss-hosted
  ARES instance's **output is used by EU/EEA staff or entities**, the Act's output-in-the-EU
  hook can pull it in. Design **once, to the higher (EU) bar**, and apply it group-wide.

---

## 5. NIS2 (Directive (EU) 2022/2555)

### 5.1 Applicability — conditional; state the test

NIS2 applies to **essential** and **important** entities that (a) operate in a **sector listed
in Annex I or Annex II** and (b) meet the **size threshold** (generally **medium+** —
**≥50 employees or >€10m turnover/balance sheet**), plus some size-independent inclusions.

**The test for Birgma/Biltema:**

1. **Sector test.** General **retail/distributive trade is _not_ a listed sector** in Annex I
   (energy, transport, banking, financial-market infra, health, water, digital
   infrastructure, ICT service management, public administration, space) or Annex II
   (postal, waste, chemicals, **food — production/processing/distribution**, manufacturing of
   certain products, digital providers, research). → **Likely out of scope** for the retail
   operation itself.
2. **Subsidiary test.** *Conditional:* if a group entity operates in a covered sector — e.g.
   **manufacturing** of in-scope products, **food distribution**, a **digital provider**
   (online marketplace/search/social), or **ICT/managed services** — that entity may be in
   scope on its own. Confirm the group's legal-entity map.
3. **Size test.** Only relevant if the sector test is met.

→ **Conclusion:** NIS2 is **likely N/A** to Birgma/Biltema as a retailer, **conditional** on
(2). Have Legal confirm the entity/sector map before closing this out (`NFR-COMP`).

### 5.2 Nordic transposition & Norway/EEA status

- **Transposition deadline was 17 Oct 2024**; national laws in **Sweden, Finland and Denmark**
  are at varying stages of adoption/entry-into-force — check the current national statute in
  each country if in scope.
- **Norway (EEA):** NIS2 is **being assessed for EEA relevance / incorporation**; Norway
  implemented the predecessor NIS1 via its Security Act framework and is preparing NIS2-aligned
  law. Treat Norwegian applicability as **pending confirmation**.

### 5.3 If in scope — obligations (for readiness)

Governance accountability of management; **risk-management measures** (Art. 21 — policies,
incident handling, business continuity, supply-chain security, encryption, MFA); and
**incident reporting** to the national CSIRT/authority on a staged clock: **early warning
within 24h**, **incident notification within 72h**, **final report within 1 month**. ARES is
well-positioned to *support* these duties (it is an incident-management tool), which is a
selling point even where the regime does not bind the group.

---

## 6. Other regimes

### 6.1 Cyber Resilience Act (Regulation (EU) 2024/2847)

- The CRA imposes cybersecurity requirements on **products with digital elements _placed on
  the market / made available_** in the EU (with vulnerability-handling and reporting duties;
  main obligations apply from **~2027**, some reporting earlier).
- **ARES is internal-only software** for the group — **not placed on the market** — so the
  CRA is **likely N/A** as a manufacturer obligation. *Condition:* if Birgma ever
  **distributes/sells** ARES (or a component) commercially, CRA manufacturer duties attach.
- Even if out of scope, its secure-development/vulnerability-handling expectations are good
  practice and overlap with ISO 27001 (doc 20).

### 6.2 PCI DSS (payment-incident context)

- The anchor scenario (`INC-2026-0047`) is a **payment-gateway** incident. PCI DSS **applies
  only if** ARES **stores, processes or transmits cardholder data (CHD) or sensitive
  authentication data (SAD)**.
- **Design invariant:** ARES should **never** ingest CHD/SAD. Incident records should
  describe *symptoms and systems* ("card payments failing in 38 stores", "TLS cert change on
  the payment gateway"), **not** PANs/track data. The **redaction filter** must catch
  card-number-shaped strings pasted into chat/tickets.
- **Boundary:** keeping ARES out of the cardholder-data environment (CDE) keeps ARES **out of
  PCI scope**. If that boundary is ever crossed, PCI DSS v4.0 requirements attach to the
  in-scope components. → `NFR-PRV`, `NFR-SEC`.

### 6.3 ePrivacy

- The ePrivacy Directive (2002/58/EC, as transposed) governs confidentiality of electronic
  communications, traffic data, and cookies/terminal-device access.
- ARES is an **internal tool**; its email is **operational staff notification, not marketing**
  (no consent-to-market issue). Cookie/consent duties are limited to the ARES web app's own
  session/analytics behaviour — keep it to **strictly necessary** cookies to stay out of
  consent requirements. Low materiality; note for completeness.

### 6.4 ISO/IEC 27701 (PIMS) — optional certification

- ISO/IEC 27701 extends the ISO 27001 ISMS (doc 20) into a **Privacy Information Management
  System**, mapping to GDPR controller/processor duties. It is **optional** but a strong
  **accountability** and procurement signal, and it operationalises much of §2 above.
  Recommended as a **should**, sequenced after 27001 certification. → `NFR-COMP`.

### 6.5 DORA (Regulation (EU) 2022/2554)

- DORA governs **digital operational resilience of _financial entities_** (banks, insurers,
  investment firms, payment/e-money institutions, crypto-asset providers, and their critical
  **ICT third-party providers**).
- **Birgma/Biltema is a retailer, not a financial entity → DORA is very likely N/A.**
- **Boundary:** DORA could attach **only if** a group entity is a **licensed financial entity**
  — e.g. an in-house **payment institution / e-money issuer**, a **consumer-credit** arm that
  is regulated as a financial entity, or if ARES were provided as an ICT service **to** a
  financial entity. A merchant experiencing card-payment failures (the anchor scenario) is
  **not** thereby a financial entity — the regulated parties are its **PSP/acquirer vendors**.
  Confirm the entity map; otherwise close as N/A. → `NFR-COMP`.

---

## 7. Jurisdictional matrix

| Jurisdiction | Data-protection law | Supervisory authority | Breach-notification timeline | EU AI Act applicability | Transfer regime (for ARES flows) |
|---|---|---|---|---|---|
| **Switzerland** | **nFADP / revDSG** (2023) + Ordinance | **FDPIC** (EDÖB / PFPDT) | To FDPIC **"as soon as possible"** where **high risk**; subjects as needed | **Not bound**; **output-in-EU** hook + market effects can reach a CH instance → build to EU bar | **Mutual adequacy CH↔EU** → no SCCs; confirm Azure region if CH residency required |
| **Sweden** | **GDPR** + Swedish Data Protection Act | **IMY** (Integritetsskyddsmyndigheten) | To SA **≤72h** (Art. 33); subjects if high risk (Art. 34) | **Applies** | **Intra-EEA** (Azure EU + SDP EU DC) — no Chapter V transfer |
| **Norway** | **GDPR via EEA** + Personal Data Act 2018 | **Datatilsynet** | **≤72h** | Applies **once AI Act is EEA-incorporated** (pending); output-in-EU may reach sooner | **Intra-EEA** |
| **Finland** | **GDPR** + Data Protection Act + **Working Life Privacy Act** | **Office of the Data Protection Ombudsman** (Tietosuojavaltuutettu) | **≤72h** | **Applies** | **Intra-EEA** |
| **Denmark** | **GDPR** + Danish Data Protection Act | **Datatilsynet** | **≤72h** | **Applies** | **Intra-EEA** |

**NIS2 applicability** is not per-jurisdiction for ARES because it turns on the **sector/size
test** (§5), which for a retailer is **likely out of scope in all five** — reconfirm per the
entity map, and per each country's transposition status if any entity is in scope.

---

## 8. Consolidated obligations checklist + prioritised remediation

Status vocabulary per `00-index.md` §7 (**Met / Partially met / Gap / N/A**). Because doc 01
owns final IDs and this is a candidate design, most items are **Partially met** (design
provides the control; the *governance artefact* is outstanding) or **Gap**.

| # | Obligation | Regime | Status (design) | Mapped ID | Priority |
|---|---|---|---|---|---|
| 1 | **Run a combined DPIA (Art. 35) + nFADP Art. 22 impact assessment** before enabling sign-in/chat ingestion & agent loop | GDPR / nFADP | **Gap** | `NFR-PRV`, `NFR-AI` | **P1** |
| 2 | **Employee-monitoring clearance + labour-law consultation** per country (SE MBL, FI co-operation, NO work-env, CH OLT 3) | GDPR + local labour | **Gap** | `NFR-PRV`, `NFR-COMP` | **P1** |
| 3 | **Document the AI-Act classification** (not prohibited; limited-risk / Art. 6(3) non-high-risk assessment) and re-test triggers | AI Act | **Gap** | `NFR-AI` | **P1** |
| 4 | **AI disclosure (Art. 50)** — bot & Copilot announce they are AI; AI drafts labelled | AI Act | **Partially met** (design intent) | `FR-AGT`, `FR-COM`, `FR-TML` | **P1** |
| 5 | **Redaction/PII filter before model** + CHD/SAD scrubbing (keeps PCI out of scope; minimisation) | GDPR/nFADP/PCI | **Partially met** (in design annex) | `NFR-PRV`, `NFR-SEC` | **P1** |
| 6 | **LIA for legitimate interest** (Art. 6(1)(f)) documented | GDPR | **Gap** | `NFR-PRV` | **P1** |
| 7 | **ROPA entry (Art. 30 / nFADP Art. 12)** finalised; obtain processor Art. 30(2) records | GDPR/nFADP | **Partially met** (§1.3 draft) | `NFR-COMP` | **P2** |
| 8 | **DPAs in place** (Microsoft Art. 28; Zoho Art. 9 nFADP), sub-processor lists filed | GDPR/nFADP | **Partially met** (standard DPAs exist) | `NFR-COMP` | **P2** |
| 9 | **Breach-notification runbook** wiring the 72h (GDPR) / "ASAP high-risk" (CH) clocks; identify lead SA | GDPR/nFADP | **Gap** | `NFR-COMP`, `NFR-OBS` | **P2** |
| 10 | **Confirm Azure region + no egress**; SCCs+TIA if any sub-processor leaves EEA/CH; re-assess if external model chosen | GDPR Ch.V | **Partially met** (in-tenant EU design) | `NFR-PORT`, `NFR-PRV` | **P2** |
| 11 | **Retention schedule** for ingest / incident / append-only audit (with Art. 17(3) exemption note) | GDPR/nFADP | **Gap** | `NFR-PRV` | **P2** |
| 12 | **Data-subject-rights workflow** for staff (access/rectify/object; erasure constrained by audit integrity) | GDPR/nFADP | **Gap** | `NFR-PRV`, `FR-ADM` | **P2** |
| 13 | **AI risk register + eval harness** (living risk mgmt; replay incidents; bias/quality) | AI Act / ISO 42001 | **Partially met** (annex §7 + eval harness planned) | `NFR-AI` | **P2** |
| 14 | **Confirm NIS2 scope** via entity/sector map; if in scope, stand up Art. 21 measures + staged reporting | NIS2 | **N/A pending confirmation** | `NFR-COMP` | **P3** |
| 15 | **Confirm DORA N/A** (no regulated financial entity in group) | DORA | **N/A pending confirmation** | `NFR-COMP` | **P3** |
| 16 | **Confirm CRA N/A** (internal-only, not placed on market) | CRA | **N/A pending confirmation** | `NFR-COMP` | **P3** |
| 17 | **Obtain GPAI/provider docs**; confirm Azure OpenAI "no-training" commitment | AI Act (GPAI) | **Partially met** | `NFR-AI`, `NFR-PRV` | **P3** |
| 18 | **Consider ISO 27701 (PIMS)** after ISO 27001 | ISO 27701 | **Gap (optional)** | `NFR-COMP` | **P3** |
| 19 | **Web-app cookies** limited to strictly-necessary (ePrivacy) | ePrivacy | **Partially met** | `NFR-PRV` | **P3** |

**Prioritisation rationale:** **P1** items are pre-conditions to switching the agent's data
ingestion on lawfully (DPIA, monitoring clearance, AI classification, AI disclosure, redaction,
LIA). **P2** items are the accountability/records/transfer artefacts that must exist before
production. **P3** items are scope confirmations (NIS2/DORA/CRA — expected N/A but must be
closed by Legal), provider documentation, and optional certification.

---

## 9. Sources & method note

Statutory references: GDPR (EU) 2016/679; Norwegian Personal Data Act 2018; nFADP/revDSG (in
force 1 Sep 2023) + DPO; EU AI Act (EU) 2024/1689; NIS2 (EU) 2022/2555; CRA (EU) 2024/2847;
DORA (EU) 2022/2554; PCI DSS v4.0; ePrivacy Directive 2002/58/EC; ISO/IEC 27701:2019. Guidance
of the EDPB, WP248 (DPIA criteria), national SAs (IMY, Datatilsynet NO/DK, Finnish DPO, FDPIC)
and CNIL informs the risk-trigger analysis. **Dates, thresholds, transposition status and
adequacy decisions change** — verify against current instruments with counsel before relying
on any single figure here.

**Again: this is analysis to inform design and brief the DPO/Legal, _not_ legal advice.**
