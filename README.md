# Mobile Command Kit

Multi-domain incident command prototype built as a TypeScript monorepo.

## Product direction

Mobile Command Kit is an incident-command platform core that can be applied across different business contexts (retail, SaaS operations, logistics, and more).

### Platform core (intended to remain domain-neutral)

- incident lifecycle and severity/state handling
- governed action execution
- approval routing by role
- tenant policy controls
- audit trail recording

### Scenario templates (intended to vary by domain)

- seeded incidents and timeline narratives
- integration posture and operational copy
- role labels and workflow emphasis
- dashboard wording and runbook context

The current seed data and UI copy are still primarily retail-oriented and should be treated as the first scenario template, not the product boundary.

## Workspace layout

- `apps/mobile`: Expo React Native mobile command view for frontline operators
- `apps/admin`: Next.js admin console for policy, audit, and integration posture
- `apps/api`: Fastify backend serving incident state and governed actions
- `packages/domain`: shared domain schemas and types
- `packages/config`: shared config values

## First local run

From the project root:

```bash
corepack enable
corepack pnpm install
corepack pnpm typecheck
```

For convenience, the root workspace also exposes:

```bash
pnpm dev:api
pnpm dev:admin
pnpm dev:mobile
```

Start each surface in its own terminal:

```bash
corepack pnpm --filter @mobile-command-kit/api dev
```

```bash
corepack pnpm --filter @mobile-command-kit/admin dev
```

```bash
corepack pnpm --filter @mobile-command-kit/mobile dev
```

## API test headers

Protected action and policy routes expect:

- `x-tenant-id`
- `x-actor-name`
- `x-actor-role`

Example actor role values:

- `incident_commander`
- `platform_lead`
- `responder`
- `stakeholder`

## Codespaces

This repo includes `.devcontainer/devcontainer.json` for GitHub Codespaces.

After pushing to GitHub:

1. Open the repository in a new Codespace.
2. Wait for `postCreateCommand` to finish installing dependencies.
3. Run `pnpm dev:api`, `pnpm dev:admin`, and `pnpm dev:mobile` in separate terminals.

Expo web is the simplest Codespaces path for the mobile surface.
