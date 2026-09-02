# Tilo V1 — Acceptance Checklist

## Foundation

- [x] App starts from documented npm commands
- [x] Light/Dark/System theme works
- [x] Indigo design tokens are centralized
- [x] Comfortable/Compact density works
- [x] Motion level can be changed
- [x] Reduced Motion is honored
- [x] Sidebar collapses and remembers state
- [x] Inspector shell is reusable
- [x] Command Menu works via keyboard and pointer
- [x] Instant Capture works globally
- [x] Global Undo feedback exists

## Data

- [x] IndexedDB/Dexie persists reloads
- [x] Schema migrations are versioned
- [x] All major records contain workspaceId
- [x] Components do not directly mutate Dexie
- [x] Historical mutations append Activity Events
- [x] JSON export works
- [x] JSON restore validates before writing
- [x] Demo workspace can be seeded deterministically

## Goal / Project / Task / Session

- [x] Goal tracking modes work
- [x] Project may be standalone
- [x] One Primary Goal + Related Goals works
- [x] Project statuses/workflow are configurable
- [x] Milestones work
- [x] Task may be standalone
- [x] Due / Scheduled / Planned Block are separate
- [x] Task workflow preserves semantic completed state
- [x] Task estimate is total expected effort
- [x] One-level Subtasks enforced
- [x] Subtasks can be scheduled and timed
- [x] Task Inspector covers common edits
- [x] Task Detail supports deep editing/history
- [x] Reschedule reason is optional
- [x] Session timer supports pause/resume/finish
- [x] Active time excludes paused segments
- [x] Background sessions do not inflate headline Active time

## Today

- [x] Default Split view
- [x] List / Timeline views work
- [x] Weekly Focus displayed
- [x] Focus ranks 1–N and reorders
- [x] Focus full → Replace flow
- [x] Next Up shows one suggestion
- [x] Next Up shows factual reason
- [x] Unscheduled task can drag to Timeline
- [x] Missing estimate creates adjustable 30-min block
- [x] Plan Ghost and Actual Solid are visually distinct
- [x] Floating Timer expands from Sidebar state
- [x] Context Line uses factual copy
- [x] Today layout can be customized within constraints
- [x] Reset Today layout works

## Calendar

- [x] Day / Week / Agenda
- [x] Last view remembered
- [x] 5/7 days setting
- [x] Side planning panel collapsible
- [x] Plan / Actual / combined filter
- [x] Drag-create time block inline
- [x] Drag move/resize with snapping
- [x] Focus Blocks supported
- [x] Recurring schedules supported
- [x] Overlaps allowed with weak indication
- [x] Background Track works
- [x] Daily Capacity works
- [x] Per-day Capacity override works
- [x] Allocation drawer works
- [x] Block Inspector shows Plan vs Actual difference
- [x] Today Timeline and Calendar Day reuse the same timeline engine

## Inbox

- [x] Instant Capture is low-friction
- [x] Unsorted badge correct
- [x] URL detection works
- [x] Unsorted / Someday / Archived views
- [x] No Inbox Pin feature
- [x] Process Inbox continuous mode
- [x] Keyboard processing shortcuts
- [x] Convert to Task/Note/Project
- [x] Archive vs Delete distinct
- [x] Trash behavior works
- [x] Someday resurfacing can appear in Weekly Review
- [x] Empty state is factual

## Analytics

- [x] This Week initial period
- [x] Period selector remembers last selection
- [x] Completion formula uses Tasks only
- [x] Active / Planned time correct
- [x] Time Accuracy formula tested
- [x] Schedule Accuracy tested
- [x] Completion Accuracy tested
- [x] Overall Planning Accuracy explained
- [x] Rescheduling reasons visible
- [x] Unplanned Work first-class metric
- [x] Capacity analysis
- [x] Time Allocation switch dimensions
- [x] Start Delay analysis
- [x] Estimate Accuracy buckets
- [x] Widget customization/reset

## Review

- [x] Daily Close Resolve / Reflect / Close
- [x] Review Home ready/completed states
- [x] Weekly Review six steps
- [x] Reflection template customizable
- [x] Goal focus can carry to next week
- [x] Weekly metrics can be chosen
- [x] Rule-based Data Summary
- [x] Rule-based Weekly Story
- [x] Story editable before completion
- [x] Review revision immutable
- [x] Reopen creates next revision
- [x] Historical snapshot does not change after Task edits
- [x] Review may be skipped

## Settings / UX

- [x] Appearance section
- [x] Motion section
- [x] Today section
- [x] Calendar section
- [x] Workflow section
- [x] Templates section
- [x] Data section
- [x] All custom layouts have Reset to Default
- [x] No motivational/guilt copy introduced
- [x] Mobile <900px is basically usable
- [x] Keyboard navigation is complete for primary paths
- [x] Focus-visible and accessible names verified

## Desktop Widgets (v1.2.0)

- [x] 6 standalone floating native widgets supported (Tasks, Inbox, Session, Timeline, Notes, Goals)
- [x] Multi-window lifecycle and multi-monitor layout persistence
- [x] 5 curated window themes (Glassmorphic, Minimal Dark, Clean Paper, Borderless Float, Retro Terminal)
- [x] 5-key titlebar control architecture (Pin, Lock, Settings, Theme, Close) with per-button visibility
- [x] Independent single-window locking and global widget lock
- [x] Double-click compact folding with auto restoration on window resize
- [x] Inline NLP quick capture in Tasks widget with persistent syntax chips and flexible date parsing
- [x] Aligned 4-category Inbox widget (Unsorted, Ideas + Notes, Archived, All) with collapsible capture
- [x] Scratchpad Notes widget with Edit / Split / Preview modes
- [x] Native Windows package generation (`.exe` / `.msi`) via Tauri

## Release gates

- [x] `npm run typecheck` passes
- [x] `npm run lint` passes
- [x] `npm run test` passes
- [x] `npm run build` passes
- [x] `npm run e2e` passes
- [x] Visual regression baselines reviewed
- [x] No V1 non-goal accidentally implemented as a half-working dependency
- [x] README describes local data and backup responsibility
