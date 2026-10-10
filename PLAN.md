# PLAN — Task Audit System

## Objective
Build a simple task management system where every valid task status change creates an immutable audit log.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma
- Validation: Zod
- Testing: Vitest + Supertest

## Architecture
Use a modular feature-based structure with NestJS-style modular patterns in the Express backend.

```text
task-audit-system/
├── apps/
│   ├── frontend/
│   │   └── src/
│   │       ├── features/
│   │       │   ├── tasks/
│   │       │   │   ├── components/
│   │       │   │   ├── tasks.api.ts
│   │       │   │   └── tasks.types.ts
│   │       │   └── audit-logs/
│   │       │       ├── components/
│   │       │       ├── audit-logs.api.ts
│   │       │       └── audit-logs.types.ts
│   │       ├── shared/
│   │       │   ├── components/
│   │       │   │   ├── Modal.tsx
│   │       │   │   ├── StatusBadge.tsx
│   │       │   │   ├── Alert.tsx
│   │       │   │   └── index.ts
│   │       │   └── constants.ts
│   │       ├── App.tsx
│   │       └── main.tsx
│   └── backend/
│       ├── src/
│       │   ├── core/
│       │   │   ├── config/
│       │   │   ├── database/
│       │   │   ├── errors/
│       │   │   ├── logger/
│       │   │   └── middlewares/
│       │   ├── modules/
│       │   │   ├── tasks/
│       │   │   │   ├── dto/
│       │   │   │   ├── entities/
│       │   │   │   ├── tasks.constants.ts
│       │   │   │   ├── tasks.repository.ts
│       │   │   │   ├── tasks.service.ts
│       │   │   │   ├── tasks.controller.ts
│       │   │   │   ├── tasks.module.ts
│       │   │   │   └── __tests__/
│       │   │   └── audit-logs/
│       │   │       ├── dto/
│       │   │       ├── entities/
│       │   │       ├── audit-logs.repository.ts
│       │   │       ├── audit-logs.service.ts
│       │   │       ├── audit-logs.controller.ts
│       │   │       └── audit-logs.module.ts
│       │   ├── app.module.ts
│       │   ├── app.ts
│       │   └── server.ts
│       └── prisma/
├── PLAN.md
├── AGENTS.md
├── ROADMAP.md
├── docker-compose.yml
├── CHANGELOG.md
└── README.md
```

## Business Rules & Domain Model
### 1. Task Management
- Valid statuses: `to_do`, `pending`, `in_progress`, `done`.
- Allowed sequential transitions:
  - `to_do -> pending`
  - `pending -> in_progress`
  - `in_progress -> done`
- Initial status on task creation is `to_do`.
- Task fields minimum: `id`, `title`, `description` (optional), `status`, `createdAt`, `updatedAt`, `deletedAt` (nullable).
- Task deletion uses soft delete (`deletedAt` timestamp):
  - Active task list excludes soft-deleted tasks.
  - Audit log history remains intact and immutable even after a task is deleted.

### 2. Status Transition & Audit Rules
- Invalid transitions (skipping statuses, backwards transitions, unknown statuses) must be rejected by the backend with HTTP 400.
- Updating to the same status is a no-op (idempotent) and must not create an audit log.
- Every valid status change creates exactly one audit log.
- `fromStatus` must be read from current database state, never trusted from client input.
- Task status update and audit-log creation must occur inside an atomic database transaction.
- Actor selection:
  - System maintains a predefined list of actors (e.g. `john.doe`, `jane.smith`, `bob.wilson`, `alice.walker`).
  - Client selects actor via dropdown and includes `actor` in the status update request.
  - Backend validates that `actor` is provided and non-empty.

### 3. Audit Log Integrity
- Audit log fields: `id`, `taskId`, `actor`, `fromStatus`, `toStatus`, `createdAt`.
- Audit logs are append-only.
- No API endpoint or database operation may edit or delete audit logs under any circumstances.
- Audit logs must be returned chronologically (`createdAt ASC`).
- Audit log human-readable representation:
  `User "{actor}" changed Task "{taskTitle}" status from "{fromStatus}" to "{toStatus}" at {timestamp}`.

## API Endpoints
- `GET /api/tasks` — List all active tasks (supports optional `?status=...` filter)
- `POST /api/tasks` — Create a new task (default status: `to_do`)
- `PUT /api/tasks/:id/status` — Update task status with body `{ status, actor }`
- `DELETE /api/tasks/:id` — Delete task (soft delete, retains audit history)
- `GET /api/tasks/:id/audit-logs` — Get chronological audit history for a task
## Audit Integrity
The application exposes no update/delete operation for audit logs. Database-level protection should also be considered where practical. The audit record and task update must be committed atomically.

## Definition of Done
- Frontend and backend run independently.
- Task creation and listing work.
- Valid sequential status changes work (`to_do -> pending -> in_progress -> done`).
- Invalid transitions are rejected by backend.
- Task deletion works via soft delete without altering or removing audit logs.
- Same-status updates are idempotent (no new audit log).
- Actor can be chosen via dropdown from predefined list.
- Audit records are created exactly once per valid transition.
- Task status and audit log remain consistent after failures (transaction rollback).
- Audit history is chronological.
- Tests cover core business rules, edge cases, and idempotency.
- README documents setup, architecture, assumptions, trade-offs, scalability risks, audit integrity, refactor priorities, and AI usage.
