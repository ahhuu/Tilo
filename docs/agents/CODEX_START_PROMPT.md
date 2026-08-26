# Codex Start Prompt

Copy the prompt below into Codex after placing this package in the intended project root.

---

Read `AGENTS.md`, `docs/MASTER_PLAN.md`, `docs/BRANDING.md`, `DEVELOPMENT_STATUS.md`, `ACCEPTANCE_CHECKLIST.md`, `docs/DECISIONS.md`, and `docs/engineering/TECH_BASELINE.md` before modifying the repository.

Treat `docs/MASTER_PLAN.md` as the V1 source of truth. The screenshots in `docs/design/reference/` are visual references; if they conflict with the written specification, the written specification wins.

Start from the exact `Next task` recorded in `DEVELOPMENT_STATUS.md`. Do not redesign the product or add new features. Do not add backend, authentication, cloud sync, collaboration, AI APIs, arbitrary page-builder behavior, or other V1 non-goals.

For this work session:

1. Inspect the current repository and existing files before making changes.
2. Implement the smallest coherent vertical slice for the current phase.
3. Follow the defined technical baseline, local-first data rules, design system, accessibility requirements, and command-layer mutation rules.
4. Reuse shared components rather than duplicating page-specific versions.
5. Run relevant checks. Before declaring the slice complete, run as applicable:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - relevant Playwright tests for critical flows
6. Fix failures that are caused by your changes. Do not claim a test passed unless it was actually run and passed.
7. Update `DEVELOPMENT_STATUS.md` before finishing with exactly:
   - Files changed
   - Features completed
   - TypeScript / ESLint / tests / build
   - Known issues
   - Next task
8. In your final response report:
   - modified/created files
   - completed functionality
   - check results
   - known issues
   - next recommended task

Begin now with the current `Next task`; do not ask for confirmation unless a genuine external credential or irreversible user decision is required.
