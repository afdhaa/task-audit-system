# ROADMAP — Task Audit System

## Milestone 1 — Foundation
- [x] Initialize repository
- [x] Configure root package scripts
- [x] Create frontend React + TypeScript + Vite app
- [x] Create backend Express + TypeScript app
- [x] Establish feature-based directories
- [x] Add environment configuration

## Milestone 2 — Persistence & Domain
- [x] Configure PostgreSQL
- [x] Configure Prisma
- [x] Create Task model (with `deletedAt` for soft delete)
- [x] Create AuditLog model (immutable, relations intact)
- [x] Add indexes and restrictive relations
- [x] Implement sequential status transition rules (`to_do -> pending -> in_progress -> done`)

## Milestone 3 — Task API
- [x] Implement `GET /api/tasks` (excludes soft-deleted tasks, supports optional `?status=...` filter)
- [x] Implement `POST /api/tasks` (initial status `to_do`)
- [x] Implement `DELETE /api/tasks/:id` (soft delete, preserves audit logs)
- [x] Add request validation with Zod
- [x] Add controller/service/repository separation

## Milestone 4 — Status Change & Audit
- [x] Define predefined actor list and validate actor input
- [x] Implement `PUT /api/tasks/:id/status` accepting `{ status, actor }`
- [x] Read current status from DB
- [x] Validate transition (`to_do -> pending -> in_progress -> done`)
- [x] Handle same-status idempotency (no-op, no audit log)
- [x] Update task and create audit log in one database transaction
- [x] Handle concurrent updates safely

## Milestone 5 — Audit History
- [x] Implement `GET /api/tasks/:id/audit-logs`
- [x] Return chronological records
- [x] Verify no audit mutation/delete API exists

## Milestone 6 — Frontend
- [x] Implement task creation form
- [x] Implement task list with clear status indicators
- [x] Implement actor selector dropdown (predefined user list)
- [x] Implement target-status dropdown & update action
- [x] Implement delete task action
- [x] Implement audit log viewer per task (modal / expandable section)
- [x] Handle loading/error/success states
- [x] Extract shared UI primitives (`Modal`, `StatusBadge`, `Alert`) into `src/shared/components/` to prevent cross-feature coupling
## Milestone 7 — Quality & Submission
- [x] Add unit/integration tests (CRUD, transitions, idempotency, soft delete, audit immutability)
- [x] Verify idempotency
- [x] Verify rollback behavior
- [x] Review concurrency behavior
- [x] Configure central Winston logger for structured HTTP latency and domain event logging
- [x] Write README with setup, architecture, assumptions, and trade-offs
- [x] Add database demo seeder (`prisma/seed.ts`) to populate initial sample tasks across all statuses (`to_do`, `pending`, `in_progress`, `done`) with realistic audit logs so that from the user's POV, the app is not completely empty on first launch
- [x] Answer required questions in README (audit immutability, high concurrency risks, first refactor, AI usage)
- [x] Final cleanup
- [ ] Push public GitHub repository
- [ ] Send submission confirmation

## Optional Later Improvements
Only after assessment requirements are complete:
- authentication
- pagination
- stronger database-level audit protection
- observability
- rate limiting
- caching
- background processing
- timezone localization & client timezone toggle (UTC vs local)

These are intentionally excluded from the initial implementation to avoid overengineering.
