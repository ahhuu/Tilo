# Tilo v1.0.0 — Official Release Notes

> **Release Version**: `1.0.0`  
> **Release Date**: 2026-08-22  
> **Target Platform**: Modern Desktop Web Browsers (Chrome 110+, Edge 110+, Firefox 110+, Safari 16.4+)

---

## 1. What is Tilo?

**Tilo** is an opinionated, local-first personal planning and execution system designed for knowledge workers who value deliberate focus, honest reflection, and calm clarity.

Unlike traditional to-do apps, Tilo simultaneously captures:
1. **Intended Plans** (when you planned to do work)
2. **Actual Focus** (when and how long you actually spent)
3. **Execution Variance** (objective variance between plans and reality)

---

## 2. Core Workflow

```text
Capture (Instant Capture / Inbox)
   ↓
Plan (Today Timeline / Calendar Drag-and-Drop)
   ↓
Execute (Focus Timer / Pause / Resume)
   ↓
Actual (Recorded Sessions / Net Active Focus)
   ↓
Review (Daily Close / 6-Step Weekly Review)
   ↓
Next Week (Strategic Goal Focus Carry-Over)
```

---

## 3. What's Included in V1.0.0

### Today View
- **Split, List, and Timeline Layouts**: Seamlessly switch between list execution and timeline scheduling.
- **Daily Focus (Rank #1, #2, #3)**: Prioritize core tasks with an intuitive replace flow when full.
- **Next Up Recommendation**: Algorithmic suggestion of one single next actionable task with factual reasoning.
- **Direct Drag Scheduling**: Drag unscheduled tasks directly onto the timeline.
- **Plan Ghost vs Actual Solid**: Distinct visual rendering of planned vs executed blocks.
- **Floating Focus Timer**: Expandable focus timer with pause, resume, and instant finish.

### Calendar
- **Day, Week (5/7 Days), and Agenda Views**: Flexible planning horizons.
- **Plan, Actual, and Combined Filters**: Inspect schedules and actual focus separately or together.
- **15-Minute Snapping**: Direct inline drag-to-create and edge resizing with automatic grid snapping.
- **Focus Blocks & Background Sessions**: Time budgets and non-blocking background tracking.
- **Daily Capacity & Overrides**: Weekday (8h) and weekend (4h) capacity indicators with single-day overrides.

### Inbox & Capture
- **Global Instant Capture (`C`)**: Sub-100ms quick capture modal with automatic URL detection.
- **Continuous Triage Mode (`P`)**: Full-screen single-key matrix triage (`1` Today, `2` This Week, `3` Someday, `T` Task, `N` Note, `I` Idea, `A` Archive, `X` Delete).
- **Someday Resurfacing**: Backlog items in Someday automatically surface during Weekly Review Step 2.

### Goals & Projects
- **Goal Progress Modes**: Automatic task completion aggregation, numeric metric goals, and ongoing focus areas.
- **Project Structure**: Multi-goal alignment (1 Primary Goal + auxiliary Related Goals) and sequenced milestones.
- **List and Board Views**: Kanban board and list layouts with sidebar pinning.

### Tasks & Sessions
- **Strict Domain Primitives**: Clean separation between Due Date, Scheduled Date, and Planned Blocks.
- **One-Level Subtasks**: Strictly enforced single-level subtasks (no recursive nesting) with independent scheduling and timing.
- **Reschedule Audit**: Optional reschedule reason logging appending to immutable `activityEvents`.

### Analytics Suite
- **Planning Accuracy Engine**: Time Accuracy (weighted duration matching), Schedule Accuracy ($\pm 15$m tolerance), Completion Accuracy, and Overall Planning Accuracy composite mean.
- **Unplanned Work**: First-class metric tracking ad-hoc session durations and ratios.
- **Start Delay & Estimate Accuracy**: Distribution latency buckets (on-time, <15m, 15-30m, >30m) and estimate error ratios ($\pm 15\%$).
- **Multi-Dimensional Time Allocation**: Swappable dimensions across Project, Primary Goal, Priority, and Tags.

### Review Hub
- **Daily Close (3 Steps)**: Resolve leftover tasks, record brief reflections, and seal daily snapshots.
- **Weekly Review (6 Steps)**: Structured retrospective wizard with auto-generated editable Weekly Story.
- **Immutable Revisions**: Sealed review revisions are strictly read-only; reopening increments revision count (`revision + 1`).

### Customization & Settings
- **Themes & Density**: Light, Dark, System themes; Comfortable and Compact spacing.
- **Motion Levels**: Reduced, Subtle, Balanced, Expressive (honors system `prefers-reduced-motion`).
- **Custom Workflows & Templates**: Configurable status semantics and task/reflection templates.

### Local-First Persistence & Backup
- **IndexedDB via Dexie 4**: All data stored locally in the browser with zero cloud dependencies.
- **Full JSON Backup & Restore**: One-click JSON export and Zod-validated transactional restore.

### Bilingual User Documentation
- Comprehensive documentation available in both **English** (`docs/user/en/`) and **Simplified Chinese** (`docs/user/zh-CN/`).

---

## 4. Platform & Requirements

- **Design Priority**: Desktop Web First.
- **Mobile Browsers**: Responsive layout with collapsible sidebar and adaptive views (usable on screens <900px).
- **Browser Compatibility**: Evergreen browsers (Chrome 110+, Edge 110+, Firefox 110+, Safari 16.4+).

---

## 5. Known Limitations

- **Browser Storage Dependency**: Clearing browser site storage/cookies erases local IndexedDB data. Regular JSON backups are recommended.
- **Single Workspace in V1**: Multiple workspaces or team workspaces are not supported in V1.

---

## 6. Not Included in V1 (V1 Non-Goals)

The following capabilities are deliberately excluded from V1 to ensure core execution focus:
- User accounts and authentication
- Remote cloud synchronization
- Multi-device real-time sync
- Native iOS / Android apps
- External calendar synchronization (Google Calendar / Outlook)
- External AI API integration
