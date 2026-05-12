# Mobile Command Kit

Retail incident command prototype built as a TypeScript monorepo.

## Workspace layout

- `apps/mobile`: Expo React Native mobile command view for store and district operators
- `apps/admin`: Next.js admin console for policy, audit, and integration posture
- `apps/api`: Fastify backend serving retail incident state and governed actions
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
