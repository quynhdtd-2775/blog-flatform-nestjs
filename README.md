# Blog/Library Platform API

[![CI](https://github.com/quynhdtd-2775/blog-flatform-nestjs/actions/workflows/ci.yml/badge.svg)](https://github.com/quynhdtd-2775/blog-flatform-nestjs/actions/workflows/ci.yml)

A [NestJS](https://nestjs.com) + PostgreSQL API for a library/blog platform (users, authors, books, categories, publishers, borrow requests, comments, avatar/cover image uploads).

## Requirements

- Node.js version pinned in [`.nvmrc`](./.nvmrc) (currently `24`). If you use `nvm`: `nvm use`.
- npm (this repo uses `package-lock.json` — always install with `npm ci`, not `npm install`, to match CI exactly).
- Docker (for local Postgres/Redis/MailHog via `docker-compose.yml`).

## Project setup

```bash
npm ci
cp .env.example .env   # then fill in real values, never commit .env
docker compose up -d   # starts Postgres, Redis, MailHog
npm run apply:migration
npm run start:dev
```

## Environment variables

See [`.env.example`](./.env.example) for the full list of variables. Never commit a real `.env` file — it's already gitignored.

## Database & migrations

TypeORM is the ORM, PostgreSQL is the database, configured in `src/configs/typeorm.config.ts`.

| Action | Command |
|---|---|
| Reset dev DB (dev only — never on production) | `npm run drop:database` |
| Generate a new migration from entity changes | `npm run add:migration --name=<change-name>` |
| Run pending migrations | `npm run apply:migration` |
| Revert the last migration | `npm run revert:migration` |
| Verify migration status | `npm run migration:show` |

Schema changes should always go through a generated migration and be committed with the PR — never edited directly on a running database.

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Tests

```bash
npm run lint        # sunlint
npm run typecheck   # tsc --noEmit
npm test             # unit tests (jest)
npm run test:cov     # unit tests with coverage
npm run test:e2e     # e2e tests (requires a real Postgres + Redis connection)
npm run build        # nest build
```

## API docs

Swagger UI is available at `/docs` when the app is running.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and push to `main`:

1. Checkout
2. Setup Node.js (version from `.nvmrc`, npm dependency cache enabled)
3. `npm ci`
4. `npm run lint`
5. `npm run typecheck`
6. `npm test`
7. `npm run build`
8. `npm audit --audit-level=high` (report-only, does not fail the build)

CI does not run `npm run test:e2e` (it needs a live Postgres/Redis connection) and does not deploy anywhere — there is currently no CD/deployment step configured for this repository.
