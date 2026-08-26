# Tilo — Post-V1 Backlog & Future Enhancements

> This document tracks non-blocking post-V1 feature ideas, architecture optimizations, and enhancement proposals.
> None of these items block the V1.0.0 release.

---

## 1. Technical Debt & Performance Optimizations

### B-001: Route-Based Code Splitting & Chunk Optimization
- **Category**: Performance / Build
- **Priority**: P3
- **Description**: Currently `dist/assets/index-*.js` bundles recharts, dexie, and lucide-react into a single ~960kB minified asset. Future releases can introduce dynamic `React.lazy()` / `import()` code splitting per top-level route (`/analytics`, `/review`, `/calendar`) to reduce initial load chunk size below 500kB.
- **Dependencies**: Vite rollupOptions chunking configuration.

### B-002: Test Harness `act(...)` Wrapper Refinement
- **Category**: Code Quality / Testing
- **Priority**: P3
- **Description**: Wrap asynchronous state updates in `settingsSectionsWorkflow.test.tsx` and `inboxTriage.test.tsx` explicitly with `act(...)` to eliminate console warning noise during test runs.
- **Dependencies**: Vitest / RTL testing utilities.

---

## 2. Post-V1 Feature Candidates

### F-001: Encrypted Cloud Backup & Multi-Device Sync (E2EE)
- **Category**: Cloud / Sync
- **Priority**: Post-V1 (Future Horizon)
- **Description**: Optional zero-knowledge encrypted cloud sync allowing users to sync their IndexedDB state across desktop browsers without compromising privacy.
- **Dependencies**: WebCrypto API, CRDT / sync protocol.

### F-002: External Calendar Feed Integration (iCal / Webcal)
- **Category**: Calendar / Integrations
- **Priority**: Post-V1 (Future Horizon)
- **Description**: Read-only subscription to external calendars (Google Calendar / Outlook / Apple Calendar) via iCal URL feeds to overlay external meetings on Tilo's timeline.
- **Dependencies**: iCal parser, background sync worker.

### F-003: Progressive Web App (PWA) Offline Packaging & Native Desktop Wrapper
- **Category**: Platform / Packaging
- **Priority**: Post-V1
- **Description**: Add PWA manifest and service worker caching for offline desktop installation, or package as a lightweight Tauri desktop app with system tray focus timer.
- **Dependencies**: Web App Manifest / Tauri.

### F-004: Project & Milestone Template Extensions
- **Category**: Templates
- **Priority**: Post-V1
- **Description**: Extend the template engine to support full Project scaffolding templates with predefined milestones and task structures.
- **Dependencies**: Template domain models.

### F-005: Optional Local LLM Review Assistant (Local-Only)
- **Category**: AI / Intelligence
- **Priority**: Post-V1
- **Description**: Optional integration with local WebGPU models (e.g. Chrome Built-in AI / WebLLM) to assist in drafting subjective reflections without sending any data to external cloud APIs.
- **Dependencies**: WebGPU / Local AI engine.
