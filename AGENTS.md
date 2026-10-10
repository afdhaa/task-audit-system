# AGENTS.md — Coding Agent Instructions

## Goal
Implement the Task Audit System according to the assessment requirements and PLAN.md.

## Required Stack
- React + TypeScript + Vite
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- Zod
- Vitest + Supertest

## Architecture
Use a modular architecture. Avoid organizing the entire application only by technical layer.

Backend features follow a NestJS-style modular architecture on Express:
- Organized into `src/core/` (shared infrastructure) and `src/modules/<feature>/` (feature modules).
- Backend modules should contain:
  - `dto/` (Data Transfer Objects & Zod request validation schemas)
  - `entities/` (Domain entity models)
  - `*.repository.ts` (Database query abstraction with Prisma)
  - `*.service.ts` (Business logic with constructor dependency injection)
  - `*.controller.ts` (HTTP request handling and response formatting)
  - `*.module.ts` (Dependency wiring and Express router binding)
  - `__tests__/` (Unit and integration tests)
- Root `app.module.ts` aggregates all module routers under `/api`.
- `src/core/` contains database (`PrismaService`), errors (`AppError`), config, and middlewares (`errorMiddleware`).

Frontend features should contain:
- components
- hooks / helpers
- API functions (`*.api.ts`)
- types (`*.types.ts`)
## Domain Rules
1. Valid statuses:
   - to_do
   - pending
   - in_progress
   - done
2. Allowed sequential transitions:
   - to_do -> pending
   - pending -> in_progress
   - in_progress -> done
3. Initial status upon creation is `to_do`.
4. Backend is the source of truth for transition validation.
5. `fromStatus` must be read from the database.
6. Same-status updates are no-ops and must not create audit logs.
7. A successful status transition creates exactly one audit log.
8. Task update and audit creation must use one database transaction.
9. Actor must be selectable via dropdown from a predefined list (e.g. `john.doe`, `jane.smith`, `bob.wilson`, `alice.walker`) and supplied in the update request.
10. Task deletion uses soft delete (`deletedAt`), removing it from active lists while preserving audit logs.
11. Audit logs are strictly append-only. Under no circumstances may audit logs be modified or deleted, even if the parent task is deleted.
12. Never expose API operations for editing or deleting audit logs.
13. Audit history must be returned chronologically.
14. Do not add authentication, roles, queues, microservices, event sourcing, or other unnecessary complexity.
## Concurrency
Protect the read/validate/write flow from concurrent status updates. Prefer a transaction with appropriate row locking or a safe conditional-update strategy.

## Validation & Error Handling
Use Zod for request validation. Return clear, semantic HTTP errors:
- 400 for invalid input or illegal status transitions
- 404 for missing task
- 409 for concurrency conflict (optimistic locking failure)
- 500 for unexpected internal errors
## Testing
Tests should cover at least:
- task creation (default status `to_do`)
- valid status transitions (`to_do -> pending -> in_progress -> done`)
- invalid status transitions (e.g. `to_do -> in_progress`, `done -> pending`)
- same-status idempotency (no audit log created)
- audit creation with actor and status snapshot
- chronological audit history
- task deletion (soft delete, verify exclusion from active list and retention of audit logs)
- missing task (404)
- transaction rollback behavior
- concurrent update consistency where practical

Do not claim tests passed unless they were actually executed.

## Frontend
Keep the UI simple and readable:
- task creation form (title, optional description)
- task list with clearly visible current status
- global/per-task actor dropdown from predefined user list
- target-status dropdown with update action
- delete task action
- audit log modal/expandable section per task showing who changed what from status to status and when
Frontend validation is optional and must never replace backend validation.

## Documentation
Keep PLAN.md, ROADMAP.md, and CHANGELOG.md aligned with implementation progress.

README must explain:
- setup
- architecture
- API
- assumptions
- trade-offs
- audit integrity
- scalability risks
- first refactor for a larger system
- AI usage and validation

## AI Usage
If AI contributes to implementation, document what was assisted by AI and how the output was reviewed and validated.
