# Changelog

All notable changes to **Tilo** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
