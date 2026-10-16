# AGENTS.md — Moon

## Mission

Moon is a web platform for discovering and managing in-person social events organized by the official Moon team in Colombia. Participants discover events, authenticate via email OTP, complete a minimal profile, and register for available places. Organizers manage official events and registrations. Deliver a welcoming, expressive, modern experience with a consistent Moon identity. This repository is a **Turborepo monorepo** with an **Angular frontend** and **NestJS backend**, managed with **pnpm**.

This file governs work across the repository. More specific `AGENTS.md` files in subdirectories may add rules for their scope. Follow user instructions and existing project conventions when they conflict with examples in this file.

## First: inspect, then change

Before coding:

1. Read the relevant `package.json` files, `turbo.json`, workspace configuration, and the nearest `AGENTS.md`.
2. Read `docs/product/PRODUCT_CONTEXT.md` and the additional documentation relevant to the task, following the routing table below.
3. Identify the affected app(s), packages, public contracts, scripts, tests, and current conventions.
4. Inspect existing components, modules, and patterns; reuse them where appropriate.
5. For non-trivial changes, state a short plan, dependencies, and validation steps before implementation.
6. Do not assume exact paths, app names, package names, Angular/Nest versions, tools, or scripts just because they appear in examples here.

Make focused changes that solve the task. Avoid unrelated refactors, dependency updates, config rewrites, or stylistic churn.

## Product documentation: source of truth and reading guide

Moon's product and architecture context lives in `docs/`. **Read selectively before proposing or changing behavior**, rather than loading every document for every task. Check that each file actually exists; if absent, report it and do not invent its contents.

### Start here

- **Every non-trivial product or implementation task:** `docs/product/PRODUCT_CONTEXT.md` for mission, users, and confirmed constraints.
- **Scoping or planning work:** `docs/product/MVP_SCOPE.md` plus `docs/decisions/OPEN_DECISIONS.md`.
- **Never treat a proposed design as an approved requirement.** Documentation uses `[C]` (confirmed), `[P]` (proposal), and `[D]` (pending), or `CONFIRMADO` / `PROPUESTA` / `PENDIENTE`. Honor these labels.

### Which documentation to read

| Task                                                    | Read first / as relevant                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Product requirements or prioritization                  | `docs/product/PRODUCT_CONTEXT.md`, `docs/product/MVP_SCOPE.md`, `docs/decisions/OPEN_DECISIONS.md`                                            |
| User journeys, pages, and navigation                    | `docs/product/USER_FLOWS.md`, `docs/product/BUSINESS_RULES.md`, `docs/product/MVP_SCOPE.md`                                                   |
| Event creation, publication, capacity, or registrations | `docs/product/BUSINESS_RULES.md`, `docs/architecture/DATA_MODEL.md`, `docs/architecture/API_CONTRACTS.md`                                     |
| Email OTP, login, session, roles, or private data       | `docs/architecture/SECURITY_AUTH.md`, `docs/product/USER_FLOWS.md`, `docs/architecture/API_CONTRACTS.md`                                      |
| Angular UI, UX, accessibility, or SEO                   | `docs/architecture/NON_FUNCTIONAL.md`, relevant product flows, `.agents/skills/moon-design-system/SKILL.md` and relevant references           |
| Reusable Angular UI, forms, feedback or overlays        | `docs/frontend/UI_COMPONENTS.md`, `docs/architecture/NON_FUNCTIONAL.md`, `.agents/skills/moon-design-system/SKILL.md` and relevant references |
| NestJS modules, integration, or API changes             | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/API_CONTRACTS.md`, `docs/architecture/DATA_MODEL.md`                                  |
| Database tables, schemas, or migrations                 | `docs/architecture/DATA_MODEL.md`, `docs/product/BUSINESS_RULES.md`, `docs/decisions/OPEN_DECISIONS.md`                                       |
| Cross-app design or external providers                  | `docs/architecture/ARCHITECTURE.md`, `docs/architecture/NON_FUNCTIONAL.md`, `docs/decisions/OPEN_DECISIONS.md`                                |
| Development process or reviews                          | `docs/engineering/DEVELOPMENT_WORKFLOW.md` and the relevant technical/product docs                                                            |

### Confirmed product boundaries

- There are **two experiences**, not two separate products: participants (`USER`) and official Moon organizers (`ORGANIZER`); visitors can explore public event information.
- Users authenticate with **email OTP**, not passwords. Minimum profile: **name, email, and city of residence in Colombia**.
- Organizers are **authorized Moon team members only**. Never add public organizer sign-up or accept a self-assigned organizer role.
- Events expose images, title, description, venue/address with map location, activity/dynamics, rules, maximum capacity, and current confirmed attendance as `registered/capacity` (e.g. `10/50`).
- Registration must be authorized and revalidated in **NestJS**, including published/eligible event state, duplicate prevention, and **atomic capacity enforcement** under concurrent requests.
- Do not add payments, public organizer onboarding, chats, rating systems, waiting lists, QR check-in, or native apps unless explicitly requested.

### Handling uncertainty and changes

1. **Verify existing code first:** architecture docs describe a target and API contracts are preliminary; they do not prove that endpoints, entities, packages, migrations, or integrations exist.
2. **Consult `OPEN_DECISIONS.md`:** never silently select the database/ORM, OTP email provider, session persistence, maps/geocoding, image storage, or unsettled event/cancellation rules.
3. If a pending decision materially impacts implementation, offer options and request user approval before committing to one. For reversible, low-impact details, make assumptions explicit.
4. When behavior or architecture is approved and changed, update the relevant `docs/product/` or `docs/architecture/` file and `docs/decisions/OPEN_DECISIONS.md` in the same change. Preserve `[C]/[P]/[D]` labeling and record reasons for consequential decisions.
5. Visual changes must remain consistent with `.agents/skills/moon-design-system/` and its approved brand assets. Docs describe **what and why**; skills describe **how to implement/design**.
6. In task summaries, distinguish **confirmed requirements**, **proposed choices**, and **implementation verified in the repository**.

## Repository and package management

- `apps/`: applications. Determine actual frontend/backend directories from workspace files.
- Shared code may live in `packages/` or other workspace directories; discover actual paths before importing or creating packages.
- Use **pnpm**. Keep `pnpm-lock.yaml` coherent with manifest changes. Do not use npm/yarn to install dependencies or generate additional lockfiles.
- Run tasks via existing workspace scripts or Turborepo filters. Discover valid commands with `pnpm run` / package manifests before executing.
- Prefer package boundaries and public exports over deep cross-app imports.
- Put genuinely shared, framework-neutral types/contracts/validation in existing shared packages when appropriate. Do not import NestJS implementation details into Angular, or Angular-specific modules into NestJS.
- Respect dependency direction and avoid cycles.
- Never modify generated output, `.turbo/`, `node_modules/`, build artifacts, or lockfiles manually.

## Installed skills: use selectively

Skills are in `.agents/skills/`. Before using one, **read its `SKILL.md`** and the references relevant to the task. These are not all mandatory for every change.

| Skill                                  | Activate for                                                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `moon-design-system`                   | Any visual UI, branding, layouts, typography, motion, mascot, or design-system work. Its brand references are the source of truth for Moon. |
| `angular-developer`                    | Angular components, templates, routing, state, forms, accessibility, tests, architecture, or frontend implementation.                       |
| `nestjs-best-practices`                | NestJS modules, controllers, providers, guards, pipes, errors, APIs, tests, or backend architecture.                                        |
| `zod`                                  | Zod schemas, runtime input validation, parsing and schema-driven contracts where Zod is already appropriate.                                |
| `design-systems-frontend-architecture` | Design tokens, reusable UI primitives, theme structure, and frontend component architecture.                                                |
| `frontend-design`                      | New visual concepts, page designs, creative composition, and polished UI.                                                                   |
| `ui-ux-pro-max`                        | UX patterns, design exploration, usability, and interface decisions.                                                                        |
| `ui-visual-composition`                | Hierarchy, composition, spacing, rhythm, and visual refinement.                                                                             |
| `web-design-guidelines`                | UI audits, accessibility and web usability reviews.                                                                                         |

### Skill coordination

- **Moon visual identity:** use `moon-design-system` as the brand authority; consult its relevant references. Generic design skills inspire implementation but must not replace Moon's established identity.
- **Angular implementation:** use `angular-developer`, with design architecture skills if reusable styles/components are involved.
- **NestJS implementation:** use `nestjs-best-practices`; add `zod` for relevant validation/contract work only when consistent with existing backend conventions.
- **End-to-end features:** combine Angular + NestJS skills, explicitly examine API contracts, errors, validation, auth, and integration tests.
- **UI reviews:** combine `moon-design-system` and `web-design-guidelines`; use `ui-visual-composition` when visual hierarchy matters.
- If skill recommendations disagree, prioritize: explicit task requirements and verified repository conventions; correctness/security/accessibility; Moon brand identity for visual choices; then optional aesthetic suggestions. Do not allow design instructions to override technical safety or functional correctness.
- Do not copy all skill rules into this file. Consult skills on demand to reduce conflicting or stale guidance.

## Moon brand and UI

- Visual direction: playful minimalism, warm night-time atmosphere, expressive illustrations, and a recognizable social/community personality.
- Core reference colors: deep night/black, vibrant orange, warm cream. Use **actual project tokens** where available; proposed hex codes in design docs are provisional until adopted.
- Moon's mascot must remain recognizable. It may change pose, expression, perspective, and contextual accessories; do not force a permanent smile or wink. Use the mascot intentionally, not on every screen.
- Avoid generic SaaS dashboards, monotonous all-white sections, excessive glassmorphism, arbitrary gradients, and decorative clutter.
- Favor legible typographic hierarchy, effective calls to action, responsive compositions, useful empty/error/loading states, and clear navigation.
- Follow semantic HTML, keyboard accessibility, visible focus, sufficient contrast, alt text, and `prefers-reduced-motion`.
- Animation must have a purpose; prefer efficient `transform`/`opacity`, and avoid jank or inaccessible autoplay effects.
- Preserve brand assets. Do not invent or silently replace an approved mascot/logo asset.

## Angular frontend

- Respect the installed Angular version and local conventions; prefer modern Angular patterns only when compatible with the project.
- Before creating or changing reusable UI, read `docs/frontend/UI_COMPONENTS.md`; import its primitives through `apps/web/src/app/shared/ui/index.ts`, preserve their accessibility contracts, and update that guide with any public API change.
- Build cohesive, small, testable components. Keep business logic out of templates and avoid unnecessary abstractions.
- Reuse existing standalone components/modules, signals/RxJS strategies, routes, styles, and forms patterns; do not introduce competing state management without a clear reason.
- Prefer typed APIs and forms when supported, predictable loading/error states, and safe rendering of user content.
- Centralize reusable visual tokens and UI components where the existing architecture supports them.
- Optimize public pages for loading performance and SEO. Check whether SSR, prerendering, metadata, and hydration are already configured before proposing changes.
- Never expose credentials, private API keys, or server-only logic in browser bundles.

## NestJS backend

- Follow existing module boundaries and dependency-injection conventions. Keep controllers thin and business rules in appropriate services/domain components.
- Validate untrusted inputs at boundaries using the project's existing mechanism (e.g. DTO/class-validator, Zod, pipes); **do not introduce a second competing validation system without justification**.
- Maintain consistent status codes and error response shapes. Do not leak internal stack traces or sensitive information in responses.
- Enforce authentication, authorization, and ownership on the server, not only in the frontend.
- Design APIs with backward compatibility in mind; coordinate contract changes with Angular consumers and tests.
- Make database changes through the project's existing migration/schema approach. Never assume a database engine or ORM from the stack alone.
- Avoid N+1 queries, missing pagination on potentially large lists, and unbounded background tasks.

## Shared contracts and data

- Prefer a single trusted source for cross-boundary types/schemas where feasible, and separate transport contracts from internal persistence models.
- Preserve serialized naming and date/time semantics, including timezone treatment; document changes explicitly.
- Validate at trust boundaries, handle nullable/optional fields intentionally, and make error scenarios explicit.
- Consider versioning or compatibility strategy for breaking API changes.

## Quality and security checklist

For each change, as applicable:

1. Check affected formatting/lint/typecheck tasks.
2. Run targeted unit/component/integration tests; add or update tests for behavior changes.
3. For UI, inspect desktop/mobile behavior, loading/empty/error states, and accessibility.
4. For backend, cover invalid input, auth/permissions, expected failures, and contract compatibility.
5. Run a filtered build where available; use broader repo tasks only when justified.
6. Report exactly what was run, what passed, and what was not run. **Never claim checks passed unless executed.**

Do not commit secrets, `.env` files, tokens, or credentials. Do not print sensitive values in logs. Treat user-controlled HTML, uploads, URLs, and database inputs as untrusted.

## Workflow and communication

- Keep plans concise and implementation incremental. Clarify substantial product ambiguities rather than inventing requirements.
- When editing, follow the local project's naming, formatting, import, i18n, error-handling, and testing conventions.
- Explain meaningful architectural trade-offs without over-documenting trivial changes.
- Before finalizing, summarize changes, paths touched, checks performed, remaining risks, and any manual follow-up.
- For analysis-only tasks, **do not modify code** unless explicitly requested.
- For code reviews, prioritize concrete issues, severity, file/line references, and recommended fixes; avoid unrequested code changes.

## Scoped instruction files (recommended, not assumed to exist)

If the repository becomes complex, add small `AGENTS.md` files inside the actual frontend and backend application directories to capture local scripts, patterns, and constraints. Keep this root file focused on cross-repository guidance. Do not create scoped files until paths and conventions have been verified.
