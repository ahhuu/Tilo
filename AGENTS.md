# AGENTS.md — Tilo

This file contains mandatory instructions for AI coding agents working on this repository.

## 1. Read before editing

Read in this order:

1. `AGENTS.md`
2. `docs/MASTER_PLAN.md`
3. `docs/BRANDING.md`
4. `DEVELOPMENT_STATUS.md`
5. `docs/audit/ACCEPTANCE_CHECKLIST.md`
6. relevant existing source files/tests

Do not begin by generating a new architecture or roadmap. The product and architecture are already defined.

## 2. Source of truth

`docs/MASTER_PLAN.md` is the V1 source of truth.

Design references are in `docs/design/reference/`.

If a generated design image conflicts with the written Master Plan, the **Master Plan wins**.

## 3. Product constraints

Tilo is:

- Desktop Web First
- Local-first
- Single workspace in V1
- React client app
- IndexedDB/Dexie persistence
- no login
- no backend
- no cloud database
- no AI API

Do not introduce server infrastructure or authentication unless the user explicitly changes scope.

## 4. Core domain model is fixed

The execution hierarchy is:

`Goal → Project → Task → Session`

Do not add arbitrary user-defined core object types.

Supporting objects such as Milestone, Note, InboxItem, PlannedBlock and ReviewRevision are allowed as defined in the Master Plan.

Subtasks are exactly one level deep.

## 5. Persistence rules

- Persistent domain data belongs in Dexie.
- Zustand is for transient UI state, not a duplicate domain database.
- React components must not write directly to Dexie tables.
- Persistent mutations must go through domain command/service functions.
- Commands that change historical meaning must append `activityEvents`.
- Cross-table mutations must use Dexie transactions.
- Review revisions are immutable.

## 6. Time rules

Do not scatter `new Date()` business logic throughout feature code.

Use the central Time Service for:

- timezone
- logical day
- day-start cutoff
- week boundaries
- period keys
- formatting
- date/time conversion

Tests must use an injectable/frozen clock.

## 7. UI rules

Visual direction: Linear-like, light, restrained, Indigo accent.

Do not:

- turn every section into a rounded card
- add excessive gradients
- add large colorful backgrounds
- mix icon libraries
- add motivational/guilt copy
- use modal dialogs for interactions that can be inline, drag, popover or Inspector

Use:

- Lucide icons
- weak borders
- minimal shadows
- project colors only as accents
- Inspector-first editing
- direct manipulation

## 8. Motion rules

Use Motion tokens/settings. Do not scatter arbitrary `transition: all` behavior.

Default motion level is Balanced.
Respect Reduced Motion.

Use dnd-kit for drag/drop and Motion for visual/layout transitions. Do not make two competing drag systems for the same element.

## 9. Dependency policy

Do not add a dependency just to save a few lines of code.

Before adding one:

1. verify existing stack cannot reasonably do it
2. prefer actively maintained dependency
3. note why it was added in `DEVELOPMENT_STATUS.md`

Do not perform major-version upgrades during feature work.

TypeScript stays on 6.x until typescript-eslint officially supports TypeScript 7 in the project baseline.

## 10. Accessibility

Every interactive feature must consider:

- keyboard operation
- focus-visible state
- accessible names
- reduced motion
- contrast
- non-color state indication

Drag/drop must have a keyboard or non-drag alternative.

## 11. Testing expectations

Run the smallest relevant tests while iterating.
Before marking a coherent task complete, run as applicable:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Run relevant Playwright tests for critical user journeys.

Do not say checks pass unless you actually ran them and they passed.

## 12. Work in vertical slices

Prefer a working slice with data + UI + test over many disconnected placeholders.

Do not create fake analytics components before underlying Plan/Actual/Session data exists, except temporary Storybook/test fixtures needed to build the shared visual component.

## 13. Demo data

Use deterministic `seedDemoData()` for development, screenshots and E2E.

Do not hardcode demo records inside production components.

## 14. End-of-session update is mandatory

At the end of every coding session, update `DEVELOPMENT_STATUS.md` with exactly these headings:

1. Files changed
2. Features completed
3. TypeScript / ESLint / tests / build
4. Known issues
5. Next task

If a check was not run, explicitly write `Not run` and why.

## 15. Do not silently change scope

Do not implement V1 non-goals from the Master Plan unless explicitly requested.

If a requested change conflicts with a frozen rule, implement the user's newest explicit instruction and record the changed decision in `docs/DECISIONS.md`.
