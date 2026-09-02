# Tilo — Frozen Decisions / ADR Log

## Frozen V1 decisions

### Product
- Home is Today, not Dashboard.
- Core model is Goal → Project → Task → Session.
- Plan and Actual are distinct first-class data.
- Calendar is core.
- Inbox is universal capture.
- Analytics and Review are separate concepts.
- Daily Close is lightweight.
- Weekly Review is a six-step flow.
- Product copy is factual, non-motivational.

### Customization boundary
- Users cannot create arbitrary core object types.
- One-level Subtasks only.
- Global + project-local custom fields.
- Today/Analytics/Review widgets can reorder within constrained grids.
- No arbitrary page builder or custom CSS.

### Visual
- Light modern UI first.
- Linear-like Indigo accent.
- Dark mode supported.
- Focus uses light cards; ordinary tasks are rows.
- Minimal shadows and minimal large color surfaces.
- Motion user-configurable, Balanced default.

### Local-first architecture
- V1 has no login/server/cloud sync/AI API.
- IndexedDB via Dexie.
- JSON export/import in V1.
- workspaceId included from day one; only one workspace exposed.
- Activity Event history retained.
- Review snapshots immutable with revisions.

### Technical baseline
- React 19.2.x
- Vite 8.1.x
- TypeScript 6.x initially
- Tailwind CSS 4.3.x
- Dexie 4.4.x
- Motion 13.x
- dnd-kit new React API
- date-fns 4 + @date-fns/tz
- Recharts 3
- Vitest 4
- Playwright 1.62+

## How to change a frozen decision

A later explicit user instruction overrides this file.
When that happens, append a dated entry below explaining:

- previous decision
- new decision
- affected modules/data
- migration implications

Do not silently change frozen decisions during implementation.

## Changes

### 2026-08-21 — Final product name
- Previous decision: A temporary working title was used during UI exploration.
- New decision: the final V1 product name is **Tilo**.
- Affected modules/data: visible app branding, document titles, backup filename prefix, package metadata when bootstrap occurs, window/document title, manifests, generated screenshots and future assets.
- Migration implications: none for domain data; implementation agents must not reintroduce any previous working title in UI or metadata.

### 2026-08-31 — Native Desktop Shell & Multi-Window Widget (Tauri v2)
- Previous decision: Tilo V1 was strictly pure web-first React browser client application.
- New decision: Introduce Tauri v2 native desktop shell to support:
  1. Standalone Windows desktop app package (`.exe`/`.msi`);
  2. Native frameless translucent multi-window desktop widget with mouse dragging (`data-tauri-drag-region`), always-on-top toggle, and frosted glass background.
- Affected modules/data: `src-tauri/` project workspace, `package.json` scripts, `src/services/tauriWidgetService.ts`, `src/components/widget/`, `src/pages/WidgetPage.tsx`.
- Migration implications: Local-first persistence remains 100% compatible on Dexie/IndexedDB via WebView2 without backend server requirement. Pure web browsers continue to run with fallback popups.

### 2026-09-02 — Desktop Widgets Architecture & NLP Quick Capture (Tilo v1.2.0)
- Previous decision: Widgets were a unified popover grid on top of the web client.
- New decision:
  1. Expand Desktop Widgets into 6 fully standalone frameless native floating windows (Tasks, Inbox, Session, Timeline, Notes, Goals) with multi-monitor layout recall and per-widget position locking;
  2. Implement inline NLP quick capture directly within the Today Tasks widget with persistent syntax chips;
  3. Align Inbox widget with main application's 4-category workflow (Unsorted, Ideas + Notes, Archived, All) with top-bar collapsible capture;
  4. Release as formal milestone **Tilo v1.2.0**.
- Affected modules/data: `src/components/widget/`, `src-tauri/tauri.conf.json`, `package.json`, `README_CN.md`, `README.md`, `docs/releases/V1_2_0_RELEASE_NOTES.md`.
- Migration implications: 100% backward compatible; layout preferences and widget configurations seamlessly persist in local storage and Dexie.

