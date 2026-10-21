# Changelog

All notable changes to **Tilo** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] — 2026-10-21

### Summary
"Consistency baseline." Tilo 1.5.0 retires the last hand-written modal shells and the Android Chinese-IME break they caused, gives every drag interaction a keyboard equivalent, and converges all user feedback onto one accessible toast channel.

### Added
- **Unified `Modal` shell** (`components/ui/Modal.tsx`): one overlay/centered-card primitive owning `z-[9999]`, the `--modal-overlay` token, scroll lock, `Esc` close, focus trap + focus restore, `role="dialog"`/`aria-modal`, and safe-area padding. 20 card dialogs now render through it.
- **Keyboard alternatives for drag**:
  - `TimelineView` planned blocks — `↑/↓` ±15 min, `Shift+↑/↓` ±1 h, `Enter` inspect, `Delete` remove, with `aria-live` announcements.
  - `WeekView` planned blocks — `←/→` ±1 day, `↑/↓` ±1 h (08:00–20:00 grid), `Enter` inspect, `Delete` remove, persisted via a new `onMoveBlock` prop.
  - `SidePlanningDrawer` task cards — focusable (`role="button"`, `tabIndex=0`); `Plan`/`Today` actions reveal on `focus-within`.
- **Toast accessibility**: `ToastContainer` is a persistent `role="region"` live region; toasts use `role="status"`/`aria-live="polite"` (info/success/warning) and `role="alert"`/`aria-live="assertive"` (error).
- **Global keyboard focus baseline** (`index.css`): a single `:focus-visible` ring for native controls and `role="button"` elements, with `[role="dialog"]` exempted.
- **Accessible names for icon-only close buttons** across 14 components (modals, mobile nav, drawers, widget shells).

### Changed
- `BottomSheet` is now a thin alias that re-exports `Modal` — no second dialog implementation.
- `npm run typecheck` now runs `tsc -b --force` instead of a no-op `tsc --noEmit` (see Fixed).

### Fixed
- **Android Chinese IME composition break** on dialogs with `<textarea>` — root-caused to `select-none` on the old overlay containers; removed by the unified `Modal` shell (also removed the stray `select-none` from Auto-Pack / Widget Settings modals).
- **Latent JSX tag imbalance** in four migrated modals (`EditNoteModal`, `AnalyticsCustomizerModal`, `WindowCloseConfirmModal`, `ContinuousProcessingModal`) — stray `</div>` before `</Modal>` that `tsc` tolerated but esbuild rejected; all 198 source files now pass a full JSX balance scan.
- **Two modals missing their `Modal` import** (`AnalyticsCustomizerModal`, `DailyCloseModal`) — the migration dropped the import line, so opening them would have thrown at runtime while `tsc` stayed silent.
- **Keyboard move only nudged once on rapid key repeat** — `TimelineView`/`WeekView` now chain from the last keypress instead of the stale block start, and clamp moves to the day timeline.
- **Typecheck was a no-op**: `tsconfig.json` is a references-only shell (`"files": []`), so `tsc --noEmit` checked nothing. Switched to `tsc -b --force` and verified with a deliberate-error probe.
- **Stale smoke test** asserting a legacy combined "目标与项目" nav entry; the sidebar now exposes separate 项目 / 目标 items.

---

## [1.4.0] — 2026-10-21

### Summary
"Let the difference be seen" — Tilo 1.4.0 closes the onboarding and orientation gap surfaced in the product/UX audit: a first-run guide that explains the plan→execute→review loop with transparent demo-data disclosure, an Analytics page that reads like plain language instead of a dashboard, and brand-new `/tasks` and `/projects` index routes so every task and project is reachable in one click.

### Added
- **First-run onboarding guide** (`components/onboarding/FirstRunGuide.tsx`): a 3-step Linear-style walkthrough shown on first launch (and to upgrading users), explaining the plan→execute→review loop, the desktop/phone division of labor, and the demo data. Reuses `BottomSheet` for full a11y (Esc, scroll lock, `role=dialog`, focus management); gated by `localStorage['tilo_has_seen_onboarding']`.
- **Transparent demo data**: injecting sample data now sets a `tilo_demo_data_seeded` marker and shows a disclosure toast; Settings → Data gains an always-visible amber banner with a one-click "clear demo data" action.
- **Analytics speaks human**: top-line metrics carry a "how to read" hint (hover/focus, `aria-label`); a deterministic, AI-free `InsightSummary` turns the week's numbers into one plain-language sentence with reverse links to Today/Review; a two-state `AnalyticsEmptyState` (truly empty vs. not enough data) replaces the blank dashboard.
- **`/tasks` index route** (`pages/TasksPage.tsx`): a cross-project task view with filter (default **unfinished & committed**), sort (priority/due/scheduled/project/title) and grouping (none/project); quick-complete/reopen via domain commands, click to open Inspector.
- **`/projects` index route** (`pages/ProjectsPage.tsx`): project overview with task counts, completion progress and pinned markers; click through to `/projects/:id`.
- **Navigation entries**: both routes are reachable from the desktop sidebar and the mobile "More" drawer; the redundant mobile project-picker sheet was removed in favor of the new index route.

### Fixed
- (No bug fixes in this pass — see v1.3.0 for the sync/IME fixes that shipped alongside the audit.)

---

## [1.3.0] — 2026-10-21

### Summary
Mobile-first interaction rebuild paired with symmetric LAN sync: the Android app now hosts its own sync endpoint so the **desktop can initiate syncs too**, and both ends discover each other and merge automatically.

### Added
- **Touch-first mobile interactions**: tap-to-schedule button on unscheduled tasks, always-visible ↑/↓ reorder controls plus `TouchSensor` drag for Daily Focus, 250 ms long-press time-block creation on the timeline (scroll-safe with `pointercancel` handling), and a Projects entry in the mobile bottom navigation.
- **Native mobile capabilities** (`@capacitor/haptics`, `keyboard`, `local-notifications`, `share`): haptic feedback, focus-end system notifications, native share sheet for exports, and `adjustResize` soft-keyboard handling.
- **Symmetric LAN sync**: a lightweight native Android sync server mirrors the desktop Rust service, so the desktop can connect to the phone directly instead of relying on phone-initiated syncs only.
- **Automatic peer discovery & sync**: `SyncManager` refreshes the local payload every 15 s, probes known peers and merges in both directions; peers are remembered on manual/scan sync and via the desktop's peer callback.
- **Mobile UX review document** (`docs/mobile-ux-review.md`) recording the audit and remediation plan.

### Fixed
- Focus timer kept playing ambient audio after a session was discarded or finished.
- Back navigation on the Calendar page returned to the Review Hub instead of closing the topmost overlay.
- Inbox checkboxes rendered oversized on touch devices.
- LAN sync flooded the screen with toasts: duplicate `lan-sync-received` listeners were registered without cleanup. Merges are now handled once and stay silent unless data actually changed.
- Reverse sync (phone → desktop) never ran because the phone never registered the desktop as a sync peer.

---

## [1.0.0] — 2026-08-22

### Summary
Initial official general release of **Tilo**, an opinionated, local-first personal planning and deep execution operating system built with React 19, TypeScript, Tailwind CSS v4, and Dexie.js (IndexedDB).

---

### Key Modules & Capabilities

#### Today
- **Flexible Execution Views**: Instant toggling between Split (List + Timeline), Full List, and Full Timeline layouts.
- **Daily Focus System**: Prioritize top 1–3 daily tasks (Rank #1, #2, #3) with seamless replace modal flow.
- **Next Up Suggestion Engine**: Objective, algorithmic single-task recommendation with factual reasoning and one-click dismiss.
- **Timeline Drag-and-Drop**: Drag unscheduled tasks directly onto the timeline with 30-minute default adjustable blocks.
- **Visual Coexistence**: Ghost dashed blocks for ex-ante plans and solid blocks for ex-post actual execution.
- **Context Line & Layout Customization**: Factual headline summaries and customizable widget order with Reset to Default.

#### Calendar
- **Multi-Horizon Views**: Day View, Week View (with 5-day weekday / 7-day full week modes), and Agenda list.
- **View Filter Modes**: Filter by Combined (Plan + Actual), Plan Only, or Actual Only.
- **Direct Timeline Manipulation**: Inline drag-to-create time blocks, 15-minute grid snapping, and non-clipping multi-column overlap layout.
- **Focus Blocks & Background Track**: Support for pre-allocated time budgets and separate non-blocking background sessions.
- **Daily Capacity & Overrides**: Weekday (8h) and weekend (4h) capacity budget lines with per-day override support.
- **Side Drawers**: Collapsible Side Planning Drawer and Project/Goal Allocation Drawer.

#### Inbox
- **Instant Capture**: Sub-100ms global quick capture modal (`C`) with automatic URL extraction.
- **Continuous Processing Mode (`P`)**: Full-screen single-item focus triage matrix with single-key shortcuts (`1` Today, `2` This Week, `3` Someday, `T` Task, `N` Note, `I` Idea, `A` Archive, `X` Delete, `J/K` Nav).
- **Someday Resurfacing**: Backlog items in Someday automatically surface during Weekly Review for scheduled reactivation.
- **Trash & Restore**: Complete isolation between Archive and soft-deleted Trash.

#### Goals & Projects
- **Goal Tracking Modes**: Task completion aggregation, custom metric logging, and ongoing focus maintenance.
- **Project Structure**: Multi-goal alignment (1 Primary Goal + auxiliary Related Goals) and sequenced milestones.
- **View Flexibility**: List and Kanban Board views with sidebar project pinning.

#### Tasks & Sessions
- **Strict Domain Primitives**: Explicit separation between Due Date, Scheduled Date, and Planned Blocks.
- **One-Level Subtasks**: Strictly enforced single-level subtasks (no recursive nesting) with independent scheduling and timing.
- **Reschedule Audit**: Objective reason logging appending to immutable `activityEvents`.
- **Focus Timer**: Floating timer with pause, resume, and finish. Active time accurately subtracts paused intervals.

#### Analytics
- **Planning Accuracy Suite**: Weighted Time Accuracy ($1 - \frac{|Actual - Planned|}{\max(Actual, Planned)}$), Schedule Accuracy ($\pm 15$m tolerance), Completion Accuracy, and Overall Planning Accuracy composite mean.
- **Unplanned Work**: First-class tracking of ad-hoc session duration and percentage.
- **Start Delay & Estimate Accuracy**: Distribution latency buckets (on-time, <15m, 15-30m, >30m) and estimate error ratios ($\pm 15\%$).
- **Multi-Dimensional Allocation**: Swappable dimensions across Project, Primary Goal, Priority, and Tags.

#### Review
- **Daily Close**: 3-step structured wrap-up (Resolve leftovers, Reflect, Close) generating immutable daily snapshots.
- **Weekly Review**: 6-step wizard (Overview, Plan vs Actual, Goals, Patterns, Reflection, Next Week).
- **Rule-Based Weekly Story**: Factual auto-generated narrative editable before sealing.
- **Immutable Revisions**: Sealed reviews are strictly unalterable; reopening creates revision increments (`revision + 1`).

#### Settings & Customization
- **Theme & Density**: Light, Dark, and System modes with Comfortable and Compact density options.
- **Motion Level**: Reduced, Subtle, Balanced, and Expressive animation tiers honoring `prefers-reduced-motion`.
- **Workflow & Templates**: Custom workflow status semantics and editable task/reflection templates.

#### Data & Backup
- **100% Local-First**: All data resides in browser IndexedDB (Dexie 4) with zero cloud dependency and zero telemetry.
- **JSON Portability**: One-click JSON backup export and Zod schema-validated transactional restore.
- **Deterministic Demo Data**: Instant seeding of realistic demo workspaces.

#### Documentation
- **Bilingual Documentation Suite**: Full Chinese (`zh-CN`) and English (`en`) Quick Start, User Guide, Concepts, Keyboard Shortcuts, Data & Backup, and FAQ documents.
