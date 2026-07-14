# ARES — Incident Command Platform

Major-incident management for **Birgma / Biltema**, built from the prototype in
`ARES Incident Command.dc.html` (the design source of truth; see `CLAUDE.md` for
the full product spec and `screenshots/` for every screen).

This repository now contains a **runnable full-stack application**:

| Layer | Stack | Location |
|---|---|---|
| Frontend | React + TypeScript + Vite, MSAL sign-in, Zustand | `frontend/` |
| Backend | ASP.NET Core 8 Web API, EF Core, Microsoft Graph SDK | `backend/` |
| Database | PostgreSQL 16 | container |
| Runtime | `docker-compose` (postgres + api + nginx-served web) | `docker-compose.yml` |

What's wired to Microsoft:

- **Entra ID sign-in** (OIDC via MSAL) for the SPA, **JWT validation** on the API.
- **Admin › Access & Roles** can **import users/groups from Entra** — from
  **groups** (and their members) and **enterprise apps** (service-principal
  assignments) — via Microsoft Graph, then map them to ARES roles.
- **Communications** releases email through **Microsoft Graph `sendMail`** from the
  shared mailbox `global.it.communications@birgma.com`, using the Birgma house
  template.

Severity is **rule-computed, never AI** — the engine is ported verbatim to both
`backend/.../Services/SeverityEngine.cs` and `frontend/src/lib/severity.ts`.

---

## Quick start (containerized, on-prem)

```bash
cp .env.example .env         # then edit — see "Entra setup" below
docker compose up --build
```

- Web UI:  http://localhost:8081
- API + Swagger:  http://localhost:8080/swagger
- API health:  http://localhost:8080/health

The API auto-creates the schema and seeds the anchor scenario
(`INC-2026-0047 — Payment failures in Sweden`) on first run.

### Demo mode (run before Entra is wired up)

With `ARES_ALLOW_DEMO_AUTH=true` (the default in `.env.example`) the API runs
**open** and the SPA skips sign-in, so you can explore the whole app immediately.
Email "release" is recorded on the timeline but **not dispatched** while Graph is
unconfigured. **Set `ARES_ALLOW_DEMO_AUTH=false` for any real deployment.**

---

## Entra setup (to enable sign-in, import, and email)

Create **one app registration** in Entra ID (Azure portal → *App registrations*).
It acts as both the API/daemon (app-only Graph) and the SPA's backing app.

1. **Expose an API**: add a scope, e.g. `access_as_user`. Note the App ID URI
   (`api://<client-id>`).
2. **Authentication → Add platform → SPA**: redirect URI = your web origin
   (e.g. `http://localhost:8081`). Enable ID tokens.
3. **Certificates & secrets**: create a client secret (or upload a certificate).
4. **API permissions → Microsoft Graph → Application permissions**, then
   **Grant admin consent**:
   - `User.Read.All` — resolve user emails when importing.
   - `Group.Read.All` — browse groups and their members.
   - `Application.Read.All` — browse enterprise apps.
   - `Directory.Read.All` — enterprise-app (service-principal) assignments.
   - `Mail.Send` — send notification email.
5. **Scope Mail.Send to the shared mailbox** (least privilege) so the app can only
   send from `global.it.communications@birgma.com`:

   ```powershell
   # Exchange Online PowerShell — restrict the app to a mail-enabled security group
   # that contains only the Global IT Communications mailbox.
   New-ApplicationAccessPolicy -AppId <client-id> `
     -PolicyScopeGroupId global-it-comms-scope@birgma.com `
     -AccessRight RestrictAccess `
     -Description "ARES may only send as Global IT Communications"
   ```

6. Fill in `.env`:

   ```ini
   ARES_ENTRA_TENANT_ID=<tenant-guid>
   ARES_ENTRA_CLIENT_ID=<client-guid>
   ARES_ENTRA_CLIENT_SECRET=<secret>
   ARES_ENTRA_API_AUDIENCE=api://<client-guid>
   ARES_WEB_ENTRA_CLIENT_ID=<client-guid>
   ARES_WEB_ENTRA_TENANT_ID=<tenant-guid>
   ARES_WEB_API_SCOPE=api://<client-guid>/access_as_user
   ARES_ALLOW_DEMO_AUTH=false
   ```

7. `docker compose up --build`. Sign in with Entra; open **Admin › Access & Roles →
   Import from Entra** to pull in groups / enterprise-app members and map roles.

The API only enforces JWT auth when Entra is configured **and** demo auth is off;
Graph endpoints return `503` with a clear message until credentials are set, so the
app degrades gracefully.

---

## Local development (without containers)

```bash
# Terminal 1 — database
docker run --rm -p 5432:5432 \
  -e POSTGRES_USER=ares -e POSTGRES_PASSWORD=ares -e POSTGRES_DB=ares postgres:16-alpine

# Terminal 2 — API
cd backend
ConnectionStrings__Postgres="Host=127.0.0.1;Port=5432;Database=ares;Username=ares;Password=ares" \
  dotnet run --project Ares.Api

# Terminal 3 — web (Vite dev server, proxies /api -> :8080)
cd frontend && npm install && npm run dev   # http://localhost:5173
```

---

## Architecture notes

- **Data model** (`backend/.../Models/Domain.cs`): incidents with relational
  children (timeline, hypotheses, evidence, actions — composite key
  `{incidentId, id}`) and jsonb value objects (severity dimensions, role
  assignment, comms drafts). Directory principals carry their Entra object id and
  the group/app they were imported from.
- **Graph** (`backend/.../Services/GraphService.cs`): app-only client credentials.
  Import reads groups / group members / service-principal assignments; email uses
  `Users[sender].SendMail`. The LLM has **no** production write access — comms and
  remediation require human approval, per the spec.
- **Frontend** (`frontend/src/`): `store.ts` (Zustand) holds all state and calls the
  typed API client; `screens/` mirrors the prototype's 16 views; three themes lifted
  verbatim into `theme/themes.ts`.

## Verification status

Verified in this environment:

- ✅ Backend compiles (`dotnet build`, 0 warnings/errors) and **runs end-to-end**
  against PostgreSQL: schema create + seed, severity engine (SEV-1/SEV-3 cases),
  incident CRUD + child mutations, the Birgma email template, and demo-mode send.
- ✅ Frontend compiles and bundles (`tsc` + `vite build`, all 16 screens).

Not runnable in this sandbox (network-isolated container builds — works wherever
the Docker daemon can reach NuGet/npm or a mirror):

- ⚠️ `docker compose build` of the `api`/`web` images (restore/`npm install` need
  registry access from inside the build). Both halves are verified to build and run
  natively, so this is an environment limitation, not a code issue. Behind a
  corporate proxy, pass proxy build-args or point NuGet/npm at an internal mirror.
