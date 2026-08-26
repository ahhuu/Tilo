# Tilo User Guide (Comprehensive Manual)

> 简体中文版 → [../zh-CN/USER_GUIDE.md](../zh-CN/USER_GUIDE.md)

---

## Table of Contents

1. [What is Tilo & Product Positioning](#1-what-is-tilo--product-positioning)
2. [Tilo Execution Cycle](#2-tilo-execution-cycle)
3. [Workspace & UI Structure](#3-workspace--ui-structure)
4. [Today View](#4-today-view)
5. [Calendar View](#5-calendar-view)
6. [Inbox & Instant Capture](#6-inbox--instant-capture)
7. [Goal Management](#7-goal-management)
8. [Project Management](#8-project-management)
9. [Task Management](#9-task-management)
10. [Focus Sessions & Timer](#10-focus-sessions--timer)
11. [Daily Capacity](#11-daily-capacity)
12. [Daily Close](#12-daily-close)
13. [Analytics Engine](#13-analytics-engine)
14. [Weekly Review Wizard](#14-weekly-review-wizard)
15. [Settings & Customization](#15-settings--customization)
16. [Templates System](#16-templates-system)
17. [Command Menu & Global Capture](#17-command-menu--global-capture)
18. [Recommended Daily Workflow](#18-recommended-daily-workflow)
19. [Three Depths of Usage](#19-three-depths-of-usage)

---

## 1. What is Tilo & Product Positioning

Tilo is a **local-first personal execution and time management system**.

### Core Positioning Principles
- **Factual presentation, never moralizing**: Tilo avoids patronizing slogans like "Great job!", "Keep going!", or guilt-inducing streak mechanics. It presents objective execution data.
- **Plan and Actual coexistence**: Tilo preserves both what you planned to do and when you actually executed, allowing you to calibrate time awareness over time.
- **Local-first privacy**: V1 operates entirely in your browser using IndexedDB with no required accounts, external backend, or tracking.

---

## 2. Tilo Execution Cycle

Tilo structures personal productivity across six interlocking phases:

```text
1. Capture   ── Instant ideas and fleeting tasks land in the Universal Inbox
2. Plan      ── Allocate time blocks on Today timeline and Calendar
3. Execute   ── Run the focus timer on a single unit of work
4. Actual    ── Record actual start/end timestamps and net active time
5. Review    ── Daily Close and 6-step Weekly Review generate immutable snapshots
6. Next Week ── Carry strategic focus goals into the next planning cycle
```

---

## 3. Workspace & UI Structure

```text
┌──────────────────────────────────────────────────────────┐
│ Header: Breadcrumbs / Active View / Daily Close / Lang   │
├─────────┬────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                              │
│         │ (Today / Calendar / Inbox / Goals / Projects / │
│ Nav &   │  Analytics / Review / Settings)                │
│ Unsorted├────────────────────────────────────────────────┤
│ Badge   │ Inspector (Right slide-out drawer: Task/Block) │
├─────────┴────────────────────────────────────────────────┤
│ Floating Timer (Bottom-right focus controller)           │
└──────────────────────────────────────────────────────────┘
```

- **Sidebar**: Press `[` to collapse or expand; state is preserved in localStorage.
- **Inspector Shell**: Click any task, plan block, or session to open the right drawer. Press `Esc` to close.
- **Floating Timer**: Appears upon starting a focus session, supporting pause, resume, and finish.

---

## 4. Today View

Today is your **daily execution workbench**, featuring three swappable views: **Split View**, **List View**, and **Timeline View**.

### 4.1 Weekly Focus
- The top header displays strategic focus goal badges and progress bars for the active week.

### 4.2 Today Focus (Focus 1–N)
- Allocate 1–3 high-priority focus tasks (Rank #1, #2, #3).
- When focus slots are full, adding another triggers the **Replace Flow modal**, allowing clear substitution.

### 4.3 Next Up Recommendation
- The engine evaluates due dates, scheduled times, and priorities to suggest **one single best next action**.
- Displays an objective factual reason (e.g. "Scheduled to start at 14:00" or "High priority unscheduled today") with one-click adoption or Dismiss.

### 4.4 Unscheduled Tasks & Timeline Drag-and-Drop
- Drag unscheduled tasks directly onto the right-side timeline to create planned blocks.
- Tasks lacking an estimate create an **adjustable 30-minute block** by default.

### 4.5 Context Line
- Factual summary: e.g. "5 scheduled, 2 completed, 2h 15m active focus today".

### 4.6 Layout Customization & Reset
- Click **Customize Layout** to toggle widget visibility and reorder modules; includes **Reset to Default**.

---

## 5. Calendar View

Calendar is the **time-horizon planning and review center**.

### 5.1 Views & Horizons
- **Day View**, **Week View**, and **Agenda View**.
- Week view supports **5-day weekday / 7-day full week** toggle; preserves your last-selected view mode.

### 5.2 Filters
- **Combined (All)**: Shows ghost dashed plan blocks alongside solid actual session blocks.
- **Plan**: Exclusively view planned schedule.
- **Actual**: Exclusively inspect where time was actually spent.

### 5.3 Inline Drag & 15-Minute Snapping
- Click and drag on empty calendar slots to create planned blocks.
- Moving and edge-resizing snap to **15-minute grid intervals**.
- Overlapping events are displayed in neat parallel columns without visual clipping.

### 5.4 Planning Drawer & Allocation Drawer
- **Side Planning Drawer**: Slide out the left task pool to drag tasks directly onto calendar days.
- **Allocation Drawer**: Slide out the right drawer to inspect time distribution across projects and goals.

### 5.5 Daily Capacity & Overrides
- Default capacity: 8 hours for weekdays, 4 hours for weekends.
- Click any day's capacity badge to set a **Per-day Override** (e.g. 6 hours for a light day).

---

## 6. Inbox & Instant Capture

### 6.1 Instant Capture
- Press `C` anywhere to open the global quick capture modal. Type text and hit `Enter` to store.
- Automatically recognizes pasted URLs and marks them as web links.

### 6.2 Process Inbox Continuous Mode
- Click **Process Inbox (P)** or press `P` on the Inbox page to enter full-screen continuous triage mode.
- **Single-Key Triage Matrix**:
  - `1`: Schedule for **Today** and convert to Task
  - `2`: Schedule for **This Week** and convert to Task
  - `3`: Move to **Someday**
  - `T`: Open Convert to Task modal
  - `N`: Convert to Note
  - `I`: Mark as Idea
  - `A`: Archive
  - `X`: Delete to Trash
  - `J` / `K`: Previous / Next item
  - `Esc`: Exit mode

### 6.3 Someday Resurfacing
- Items in Someday automatically surface during **Weekly Review Step 2** for scheduled triage.

---

## 7. Goal Management

- **Tracking Modes**:
  1. **Task Completion**: Progress auto-aggregates from completed tasks in linked projects.
  2. **Metric Goal**: Set target numbers (e.g. "Read 20 papers") and log numeric entries.
  3. **Ongoing**: Continuous areas of focus without a terminal percentage.
- **Weekly Focus**: Pin goals to the active week's strategic focus banner.

---

## 8. Project Management

- **Primary & Related Goals**: Projects link to 1 Primary Goal and optional Related Goals for progress aggregation.
- **Milestones**: Add time-bound phase milestones.
- **View Modes**: Toggle between **List View** and **Kanban Board View**.
- **Pinned Projects**: Pin frequently used projects to the sidebar navigation.

---

## 9. Task Management

- **Attributes**: Title, Markdown description, Priority (Urgent/High/Medium/Low/None), Estimate, Due Date, Scheduled Date, Tags.
- **One-Level Subtasks**: Strictly enforced single-level subtasks (no recursive nesting). Subtasks can be scheduled and timed independently.
- **Reschedule Audit**: Changing scheduled dates prompts for an optional reschedule reason, appending a neutral record to `activityEvents` for analytics review.

---

## 10. Focus Sessions & Timer

- **Timer Controls**: Start, Pause, Resume, Finish.
- **Duration Formula**:
  $$\text{Active Time} = \text{Elapsed Time} - \text{Paused Time}$$
- **Background Sessions**: Long-running background processes (e.g. running test suites or builds) can be designated as background sessions without inflating headline active focus time.

---

## 11. Daily Capacity

- **Budgeting Boundary**: Acts as an objective guideline for healthy time commitments.
- **Over-Capacity Indicators**: Days exceeding capacity are marked with subtle badges, helping prevent over-scheduling without rigid restrictions.

---

## 12. Daily Close

Complete end-of-day wrap-up in three simple steps:
1. **Resolve**: Triage unfinished tasks (postpone to tomorrow, move to inbox, or cancel).
2. **Reflect**: Optionally record factual notes or reflections.
3. **Close**: Seal today's immutable execution snapshot.

---

## 13. Analytics Engine

Analytics provides 12 objective metrics computed strictly according to Master Plan specifications:

| Metric Name | Computation & Logic | Interpretation |
| :--- | :--- | :--- |
| **Completion Rate** | $\frac{\text{Scheduled tasks completed in period}}{\text{Total valid tasks scheduled for period}}$ | True delivery rate (excluding subtask inflation). |
| **Time Accuracy** | Plan/Actual pairs: $1 - \frac{\|Actual - Planned\|}{\max(Actual, Planned)}$, weighted by planned duration | Measures how closely session durations match planned blocks. |
| **Schedule Accuracy**| $\frac{\text{Sessions started within } \pm 15 \text{ min of planned start}}{\text{Total paired sessions}}$ | Measures punctuality and schedule adherence. |
| **Completion Accuracy**| Identical to scheduled task completion rate | Delivery reliability. |
| **Overall Planning Accuracy**| $\frac{\text{Time Acc} + \text{Schedule Acc} + \text{Completion Acc}}{3}$ | Composite mean score with formula tooltip. |
| **Unplanned Work**| Duration and percentage of active sessions executed without a pre-planned block | Quantifies ad-hoc interruptions and unscheduled work. |
| **Start Delay Analysis**| Breakdown of session start latency (on-time / <15m / 15-30m / >30m) | Diagnoses execution friction and procrastination. |
| **Estimate Accuracy**| Ratio $\frac{Actual - Estimate}{Estimate}$, bucketed into Accurate ($\pm 15\%$), Underestimated (>15%), Overestimated (<-15%) | Calibrates effort estimation accuracy. |
| **Capacity Analysis**| Daily planned vs actual hours vs capacity limit | Tracks over-scheduling tendencies. |
| **Time Allocation**| Slices active time by Project, Primary Goal, Priority, or Tag | Visualizes strategic effort distribution. |
| **Rescheduling Analysis**| Aggregates reschedule activity events and reasons without blame | Identifies systemic planning bottlenecks. |

---

## 14. Weekly Review Wizard

The 6-step structured weekly review:
1. **01 Overview**: Factual summary of active vs planned hours, completion count, and goal progress.
2. **02 Plan vs Actual**: Review timeline variance, time accuracy, and triage resurfaced Someday items.
3. **03 Goals**: Inspect goal contributions across active projects.
4. **04 Patterns**: Analyze unplanned work, start delays, and rescheduling reasons.
5. **05 Reflection**: Review and edit the automatically generated **Weekly Story** before sealing.
6. **06 Next Week**: Pick next week's focus goals and target metrics, then seal the immutable revision.

- **Reopen**: Reopening a sealed review increments the revision counter (`revision + 1`) while keeping previous revision history intact.
- **Skip**: Explicitly mark a week as skipped without distorting historical data.

---

## 15. Settings & Customization

- **Appearance**: Light / Dark / System theme; Language (English / 简体中文); Density (Comfortable / Compact).
- **Motion**: Reduced / Subtle / Balanced / Expressive (honors system `prefers-reduced-motion`).
- **Workflow**: Customize status names, colors, and semantic mappings (Open / Active / Waiting / Completed / Cancelled).
- **Data Management**: Export JSON backup, validate and restore backups, or reset demo data.

---

## 16. Templates System

- **Task Templates**: Apply preset subtask structures, estimates, and checklists.
- **Reflection Templates**: Customize reflection questionnaires for Daily Close and Weekly Review.

---

## 17. Command Menu & Global Capture

- **`Ctrl+K` / `Cmd+K`**: Global command menu for searching tasks, switching routes, and running quick actions.
- **`C`**: Instant Capture modal to log fleeting thoughts without leaving your current task.

---

## 18. Recommended Daily Workflow

### Morning (3–5 min)
1. Open Today view and check Weekly Focus.
2. Pick 1–3 core tasks as Focus #1–#3.
3. Drag tasks onto Timeline and verify against Daily Capacity.

### During the Day
1. Start Session on your top Focus task.
2. Press `C` to dump interruptions and incoming tasks into Inbox.
3. Click Finish upon completing sessions.

### Evening (1–2 min)
1. Trigger Daily Close.
2. Postpone unfinished tasks, write a brief reflection note, and seal the day.

---

## 19. Three Depths of Usage

- **Lightweight**: Use Today task list, Focus #1, and Daily Close for basic task execution.
- **Standard (Recommended)**: Structure work into Goals → Projects → Tasks, schedule timeline blocks, and run Weekly Review.
- **Deep**: Utilize Daily Capacity budgeting, Plan vs Actual variance analysis, custom workflow statuses, and multi-dimensional analytics.
