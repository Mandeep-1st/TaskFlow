# I WROTE THE CODE BUT REVIEWED THE README. (IT CONTAIN END-TO-END EVERYTHING ONE SHOULD KNOW ABOUT)

# TaskFlow — Backend

A multi-tenant project management backend. Users belong to organizations, manage projects and
tasks, assign work to teammates, comment on tasks, and receive background email notifications
when assigned. Built with Node.js/Express, PostgreSQL (via Prisma), and Redis/BullMQ for
background jobs.

## Tech Stack

| Layer Technology     |                                                                   |
| -------------------- | ----------------------------------------------------------------- |
| Language / Framework | TypeScript, Express                                               |
| Database             | PostgreSQL, accessed via Prisma ORM                               |
| Job Queue            | Redis + BullMQ                                                    |
| Auth                 | JWT (access + refresh), bcrypt password hashing                   |
| Validation           | Zod                                                               |
| API Docs             | OpenAPI 3.0 via `swagger-jsdoc`, served with `swagger-ui-express` |
| Testing              | Vitest                                                            |
| Containers           | Docker Compose (Postgres, Redis, API, Worker)                     |

## Architecture

Two separate Node applications sharing one PostgreSQL database and one Redis instance:

- **`api/`** — the HTTP server. Handles auth, all REST endpoints, and enqueues background jobs. Internally follows Route → Controller → Service → Prisma (no separate repository/data layer — services call Prisma directly).
- **`worker/`** — a standalone BullMQ worker process. Watches the same Redis queue the API enqueues jobs into and processes them (currently: mock email sending) independently of the API's request/response cycle.

Multi-tenancy is enforced at the service layer: every query is scoped by the `orgId` taken from
the authenticated user's JWT (attached by `verifyJwt` middleware as `req.user`), never trusted
from the request body, params, or query string. Tasks don't store `orgId` directly — their
organization is resolved via `task → project → project.orgId`, and every task-touching service
function checks that chain before returning or mutating anything.

## Data Model

`User`, `Organization`, `OrgMember` (join table: user ↔ org, carries the `role` — `org_admin` or
`member`), `Project` (belongs to an org), `Task` (belongs to a project; `status` and `priority`
enums), `TaskAssignment` (join table: task ↔ user), `Comment` (belongs to a task and an author),
and `RefreshToken` (one row per login session — supports multiple concurrent devices and
per-session revocation, rather than a single token field on `User`).

Foreign key behavior is a deliberate mix of `CASCADE` and `RESTRICT`, documented inline in
`schema.prisma`: deleting an organization cascades through its projects/tasks (structural
ownership — a project has no meaning outside its org), while user-authored content
(comments, assignments, memberships) restricts deletion of the user, so history isn't silently
erased as a side effect.

## Auth Model

- Access tokens are short-lived JWTs (15 min), stateless — never stored, just verified on each request.
- Refresh tokens are longer-lived (7 days) and stored **hashed** in a dedicated `RefreshToken` table, one row per login/device. This supports logging in from multiple devices independently, revoking a single session on logout, and revoking all sessions at once (logout-all).
- Only an `org_admin` can add members to their organization (`POST /auth/members`) — there's no self-service "join an org by name" flow, since organization names aren't secret and that would let a stranger join any company by guessing its name. Adding a member either links an existing user account to the org, or creates a brand-new account with an admin-supplied temporary password — the response tells the caller which of the two happened (`workflow` + `passwordApplied` fields), so the admin knows whether the password they're about to relay is actually valid for that person.
- All four `/auth/*` endpoints are rate-limited to 10 requests/minute/IP.

## Background Jobs

Assigning a user to a task (`POST /tasks/:id/assign`) persists the assignment **and** enqueues an
email-notification job inside a single Prisma transaction. If enqueueing to Redis fails for any
reason, the transaction throws and the assignment is rolled back — the two can never go out of
sync; either both succeed or neither does.

The worker retries failed email jobs up to 3 times with exponential backoff (1s → 2s → 4s). Once
a job exhausts all retries, its payload and failure reason are recorded in a separate dead-letter
queue (`email-dead-letter-queue`), while the original job remains queryable at `GET /jobs/:id`
with status `failed`.

Job endpoints:

- `GET /jobs/:id` — status and metadata for a specific job
- `GET /jobs` — list jobs across all states (waiting/active/delayed/completed/failed)
- `GET /jobs/dead-letters` — list jobs that exhausted their retries

## Getting Started

### Environment Variables

Copy `api/.env.example` to `api/.env` and fill in real values:

```
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskflow
REDIS_URL=redis://localhost:6379
JWT_ACCESS_TOKEN_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_TOKEN_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000

```

The worker only needs `REDIS_URL` (and `DATABASE_URL` if/when it starts touching the database —
currently it doesn't, since email sending is mocked).

### Run with Docker Compose (recommended)

```bash
docker-compose -f docker-compose.main.yml up --build

```

This starts Postgres, Redis, the API, and the Worker together. The API container runs pending
Prisma migrations automatically on startup before the server boots. API is reachable at
`http://localhost:3000`.

### Run locally without Docker

```bash
# terminal 1 — API
cd api
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed   # optional: seeds 2 orgs, 5 users, projects, tasks, assignments, comments
pnpm dev

# terminal 2 — Worker
cd worker
pnpm install
pnpm dev

```

Requires a locally running Postgres and Redis (or point `DATABASE_URL`/`REDIS_URL` at Dockerized
versions of just those two services).

## API Documentation

- **Swagger UI**: once the API is running, visit `http://localhost:3000/api-docs` for interactive, browsable documentation of every endpoint, generated from JSDoc comments above each route handler (kept in sync with the actual Zod validators).
- **Postman collection**: `docs/postman/TaskFlow.postman_collection.json`, with a companion environment file at `docs/postman/TaskFlow.postman_environment.json`. Import both, run the **Login** request once, and every other request in the collection will work automatically — a test script on Login saves the access token, refresh token, and organization ID into collection variables, so nothing needs to be copy-pasted between requests manually.

## Testing

### Unit tests — done

```bash
cd api
pnpm test

```

Covers, with Prisma and bcrypt mocked (no real database or network calls involved):

- **Auth logic** — password hashing uses the correct cost factor, duplicate-email registration is rejected, login rejects on a failed password comparison, and generated access/refresh tokens carry the expected payload.
- **Task assignment validation** — assigning a user outside the task's organization is rejected, and duplicate assignments are rejected, both without ever reaching the database write.
- **Pagination helper** — correct `skip`/`take` calculation and correct `{ data, total, page, limit }` response shape.

### Integration tests — in progress

Integration tests (login flow end-to-end, full task CRUD through real HTTP requests, cross-tenant
access returning 403/404, and validation/error-shape scenarios against a real test database) are
the immediate next piece of work, being built out now. The planned approach is a dedicated test
database (e.g. `taskflow_test`) reset between test runs via Prisma migrate reset, exercised
through the actual Express app instance rather than a live server, so each test starts from a
known, clean state. This section will be updated once that work lands.

## Project Structure

```
taskflow/
├── docker-compose.main.yml
├── docs/postman/                  # exported Postman collection + environment
├── api/
│   ├── prisma/                    # schema, migrations, seed script
│   ├── src/
│   │   ├── config/                 # env, prisma client, redis connection, swagger spec
│   │   ├── routes/                 # thin route definitions + OpenAPI JSDoc comments
│   │   ├── controllers/            # thin request/response wrappers
│   │   ├── services/                # business logic, org-scoping, Prisma queries
│   │   ├── middleware/              # auth (JWT), RBAC, rate limiting, Zod validation
│   │   ├── validators/               # Zod schemas
│   │   ├── jobs/                     # BullMQ Queue (producer side)
│   │   └── utils/                    # ApiError, ApiResponse, pagination, tokens
│   └── tests/                       # Vitest unit tests
└── worker/
    └── src/
        ├── config/                   # redis connection
        ├── processors/                 # BullMQ Worker (consumer side) — email job handler
        └── index.ts

```

## Security Notes

- No secrets, `.env` files, or credentials are committed — see `.gitignore`.
- Passwords and refresh tokens are hashed with bcrypt before storage; raw tokens are never persisted.
- Every service-layer query scopes by the authenticated user's `orgId` from their JWT; the client's own `org_id`/IDs in the request body or params are never trusted for authorization decisions.


