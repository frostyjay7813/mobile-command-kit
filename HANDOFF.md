# Mobile Command Kit Handoff

## Product

Mobile Command Kit is a multi-domain incident command prototype.

The core platform is designed to support live operational incidents across business types, for example:

- retail disruption (payment authorization failures)
- SaaS platform degradation (authentication outage)
- logistics exceptions (fulfillment queue delays)

### Architecture intent

- Keep workflow primitives (`incident`, `action`, `approval`, `policy`, `audit`) domain-neutral.
- Express vertical requirements through scenario templates and seeded data.
- Avoid hardcoding domain nouns in core contracts unless they are truly universal.

The product shape today is:

- `apps/mobile`: Expo mobile command dashboard for frontline operators
- `apps/admin`: Next.js admin console for policy, audit, and integration posture
- `apps/api`: Fastify backend with mocked integrations and JSON persistence
- `packages/domain`: shared schemas and types

## Current State

- Mobile renders live dashboard state from the API.
- Admin renders incident overview, integration readiness, and policy posture.
- Backend persists demo state in `apps/api/data/store.json`.
- Integrations are mocked in `apps/api/src/lib/adapters.ts`.
- Auth is header-based only and not production-ready.

## Demo Workflow

The current seeded workflow remains retail-oriented (Sev1 payment outage), used as scenario template v1:

- incident commander can freeze config changes
- platform lead approval is required to activate backup processing
- stakeholder role owns customer/store updates

A second incident demonstrates a monitoring/recovery state for queue backlog recovery.

## Local Run

From the repo root:

```bash
corepack enable
pnpm install
```

Start each app in its own terminal:

```bash
pnpm dev:api
pnpm dev:admin
pnpm dev:mobile
```

## Codespaces Notes

- `.devcontainer/devcontainer.json` installs dependencies automatically.
- Ports forwarded by default:
  - `3000` for Next admin
  - `4000` for Fastify API
  - `8081` for Expo
- Expo web is the easiest Codespaces path.
- Native iOS/Android simulator workflows are not the primary target for Codespaces.

## Known Gaps

- No real authentication or tenant management
- No real database
- No real external integrations
- No command execution UI yet in mobile or admin
- No policy editing UI yet
- No test coverage for key command workflows
- Retail wording still appears in seeded copy and component text
- No explicit scenario-pack mechanism yet for non-retail templates

## Recommended Next Milestones

1. Add mobile action controls for approvals and governed commands.
2. Add admin policy editing and role-aware views.
3. Introduce scenario templates to demonstrate at least one non-retail domain.
4. Define a scenario-pack contract (seed data + copy + role mapping) used by all surfaces.
5. Replace JSON persistence with a real database.
6. Replace mocked adapters with real Slack/PagerDuty/GitHub integration boundaries.
7. Add tenant, org, and regional models for true multi-tenant deployment.
