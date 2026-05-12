# Mobile Command Kit Handoff

## Product

Mobile Command Kit is a retail incident command prototype.

The current demo focuses on live store-operations incidents such as:

- POS payment authorization failures
- Curbside pickup queue delays

The product shape today is:

- `apps/mobile`: Expo mobile command dashboard for district/store operators
- `apps/admin`: Next.js admin console for policy, audit, and integration posture
- `apps/api`: Fastify backend with mocked integrations and JSON persistence
- `packages/domain`: shared schemas and types

## Current State

- The mobile app now renders a live retail dashboard from the API.
- The admin app renders a retail-oriented incident overview.
- The backend persists demo state in `apps/api/data/store.json`.
- Integrations are mocked in `apps/api/src/lib/adapters.ts`.
- Auth is header-based only and not production-ready.

## Demo Workflow

The main incident demo is a Sev1 payment outage:

- incident commander can freeze POS config changes
- platform lead approval is required to activate the backup processor
- stakeholder role owns store-manager/customer updates

The second incident demonstrates a monitoring/recovery state for curbside operations.

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
- No test coverage for the retail flows

## Recommended Next Milestones

1. Add mobile action controls for approvals and governed commands.
2. Add admin policy editing and role-aware views.
3. Replace JSON persistence with a real database.
4. Replace mocked adapters with real Slack/PagerDuty/GitHub integration boundaries.
5. Add tenant, store, and region models for true retail multi-tenancy.
