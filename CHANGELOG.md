# Changelog

All notable project changes should be recorded here.

## [1.1.0] - 2026-10-10

### Added
- **Server-Side Status Filtering (`GET /api/tasks?status=...`)**:
  - Added `getTasksQuerySchema` Zod validation for optional `status` query parameter.
  - Updated `TasksRepository`, `TasksService`, and `TasksController` to support filtering active tasks by domain status.
  - Updated frontend `tasks.api.ts` and `App.tsx` with dynamic refetching upon filter tab selection (`useEffect(() => loadTasks(filterStatus), [filterStatus])`).
  - Added backend integration test covering status query parameter filtering.
- **Structured Backend Logging with Winston (`core/logger/`)**:
  - Configured central Winston logger in `core/logger/logger.ts` with colorized terminal output in development, JSON in production, and stack trace parsing.
  - Added `requestLoggerMiddleware` capturing HTTP method, path, status codes, and latency in ms.
  - Integrated structured domain event logging in `TasksService` for task creation, status transitions, idempotent updates, and soft deletions.
- **Database Demo Seeder (`prisma/seed.ts` & `npm run seed`)**:
  - Created database seeder populating initial sample tasks across all 4 lifecycle statuses (`to_do`, `pending`, `in_progress`, `done`) along with realistic chronological audit logs.
  - Ensures that from the user / evaluator's perspective upon first launch or testing, the dashboard is not completely empty, and the full timeline capabilities can be observed immediately.
  - Integrated into root script `npm run seed` and automated during container startup in `docker-entrypoint.sh`.

### Refactored
- **Frontend Shared Component Layer (`apps/frontend/src/shared/components/`)**:
  - Extracted domain-common `StatusBadge` from `features/tasks/components/` into `shared/components/StatusBadge.tsx`, resolving cross-feature module coupling where `features/audit-logs` was directly importing from `features/tasks`.
  - Created reusable generic `Modal` dialog component with backdrop click-to-dismiss, ESC key listeners, customizable headers, and animations in `shared/components/Modal.tsx`.
  - Created reusable `Alert` banner component in `shared/components/Alert.tsx` with semantic styles (success, error, info, warning) and dismiss triggers.
  - Refactored `CreateTaskModal` and `AuditLogsModal` to wrap the shared `Modal` and `Alert` components, eliminating duplicated modal shell markup.
  - Refactored `TaskCard` to consume the shared `StatusBadge`.
  - Refactored `App.tsx` notification feedback banner to utilize the shared `Alert` component.
  - Implemented target status dropdown filtering in `TaskCard.tsx` to omit previous statuses (defensive UX against accidental rollbacks), with strict domain validation maintained on the backend.

## [1.0.0] - 2026-10-10

### Added
- **Frontend**:
  - React 18 + Vite + TypeScript + Tailwind CSS application in `apps/frontend`.
  - Task list dashboard displaying active tasks, current status badges, and created dates.
  - Task creation modal with validation (title required, optional description).
  - Actor selection via dropdown supporting predefined user list (`john.doe`, `jane.smith`, `bob.wilson`, `alice.walker`).
  - Target status selector and Next Step shortcut button.
  - Task soft-deletion action.
  - Audit log viewer modal with chronological timeline view, actor tags, status change badges, and human-readable audit text.
  - Real-time feedback banners for transitions, idempotency notifications, and transition rejections.
- **Backend (NestJS-Style Modular Monolith)**:
  - Express + TypeScript REST API in `apps/backend` organized into `core/` and `modules/`.
  - Core kernel: `core/config/`, `core/database/prisma.service.ts`, `core/errors/app-error.ts`, and `core/middlewares/error.middleware.ts`.
  - Feature modules with isolated layers:
    - `modules/tasks/`: `dto/`, `entities/`, `tasks.constants.ts`, `tasks.repository.ts`, `tasks.service.ts`, `tasks.controller.ts`, `tasks.module.ts`.
    - `modules/audit-logs/`: `dto/`, `entities/`, `audit-logs.repository.ts`, `audit-logs.service.ts`, `audit-logs.controller.ts`, `audit-logs.module.ts`.
  - Root `AppModule` managing module route registration and Express router aggregation.
  - PostgreSQL persistence with Prisma ORM (`tasks` and `audit_logs` models).
  - `GET /api/tasks` (active tasks only).
  - `POST /api/tasks` (creates task with default `to_do` status).
  - `PUT /api/tasks/:id/status` (atomic status update and audit log recording inside database transaction).
  - `DELETE /api/tasks/:id` (soft-delete via `deletedAt` preserving audit history).
  - `GET /api/tasks/:id/audit-logs` (chronological audit history).
  - Domain transition validation enforcing strict order: `to_do -> pending -> in_progress -> done`.
  - Idempotent update handling (same-status requests are no-ops without creating audit logs).
  - Optimistic concurrency protection using task versioning.
  - Zod validation schemas for request bodies and UUID parameters.
  - Global error handling for domain errors (400, 404, 409, 500).
- **DevOps & Containerization**:
  - Multi-container `docker-compose.yml` orchestrating PostgreSQL 16, Express backend, and Nginx frontend.
  - Production-ready `Dockerfile` for backend with automatic Prisma migration deployment entrypoint.
  - Multi-stage `Dockerfile` and `nginx.conf` for frontend with reverse-proxy routing to `/api`.
- **Testing & Verification**:
  - Comprehensive automated integration and concurrency tests in Vitest + Supertest (9 passing tests in `modules/tasks/__tests__/tasks.integration.spec.ts`).
  - Total test isolation via `InMemoryPrismaClient`.
- **Documentation**:
  - Complete `README.md` including setup instructions, architecture breakdown, assumptions, trade-offs, failure scenarios, and in-depth answers to all technical evaluation questions.

### Architecture Decisions
- Adopted NestJS-style modular architecture on Express to tame unopinionated Express conventions, standardize code layout, eliminate file-placement cognitive load, enforce constructor dependency injection, and ensure effortless future module expansion.
- Use PostgreSQL because audit integrity and transactional consistency are core requirements.
- Use Prisma for typed database access and transaction support.
- Keep authentication out of scope as specified; provide a predefined user list selectable via dropdown.
- Use soft delete (`deletedAt`) for tasks to ensure audit logs are strictly preserved and never mutated or deleted.
- Keep the initial system as a modular monolith rather than introducing premature microservices or message broker infrastructure.
- Enforce transition rules strictly in the backend domain layer; frontend guidance is supportive only.

## Changelog Maintenance
Update this file when:
- a feature is implemented
- an architecture decision changes
- an important trade-off is introduced
- an assessment requirement is added or changed
