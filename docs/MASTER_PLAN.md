# Tilo V1 — Master Product & Implementation Plan

> Final product name: **Tilo**. This name is frozen for V1 branding and implementation unless the user explicitly changes it later.
>
> This document is the source of truth for V1. If a UI reference image conflicts with this document, **this document wins**.

## 0. Executive summary

Tilo is a local-first personal execution system centered on one loop:

**Capture → Plan → Execute → Actual → Close → Analyze → Review → Next Week**

It is not a generic todo app and not a Notion-like page builder. The core execution model is fixed:

**Goal → Project → Task → Session**

Users may customize how these objects are displayed and tracked, but may not invent arbitrary new object types or arbitrary page structures.

The product should answer three questions better than ordinary todo apps:

1. **What did I intend to do?**
2. **What did I actually do?**
3. **What happened between the plan and reality?**

V1 is a **Desktop Web First, local-first, single-workspace application** with no login, no server, no cloud database, and no AI API. It must remain usable offline after the app bundle has loaded. All user data is stored in IndexedDB and can be exported/imported as JSON.

---

# 1. Product principles

## 1.1 Fixed structure, flexible expression

The product owns the core structure. Users control presentation and tracking details.

Fixed concepts:

- Goal
- Project
- Task
- Session
- Today
- Inbox
- Calendar
- Analytics
- Review

Customizable concepts:

- Task and project workflows/status names
- Global and project-local custom fields
- Goal progress method
- Project colors
- Today widgets/order
- Review widgets/order
- Analytics widgets
- Focus count (1–5)
- Calendar defaults
- Motion level
- Theme / accent / density
- Templates

Not allowed in V1:

- Arbitrary user-defined object types
- Arbitrary HTML/CSS
- Page builder
- Infinite nested blocks
- Infinite nested subtasks
- Plugin marketplace
- Template marketplace
- Knowledge graph / wiki system
- Backend, login, sync, collaboration

## 1.2 Plan and Actual are first-class, separate data

Never infer historical planning from current task fields.

A task may be scheduled for a day and may have zero, one, or many planned time blocks. Actual work is recorded as sessions. The system must retain historical events so a later edit does not erase what was planned at the time.

## 1.3 Suggest, do not assume

Examples:

- Natural-language date detection should suggest a date, not silently apply uncertain parsing.
- Next Up may recommend one task, but should not command the user.
- Schedule overlaps should be indicated, not blocked.
- Capacity overages should be displayed, not judged.
- Long timers should be questioned, not auto-stopped.

## 1.4 Factual, non-judgmental copy

Preferred:

- `2 priorities remaining.`
- `3 items need a decision.`
- `Plan updated.`
- `Session ended.`
- `Review ready.`
- `Nothing to process.`
- `Run47 has been active for 3h 42m.`

Avoid:

- `Great job!`
- `You're crushing it!`
- `Don't give up!`
- `Stay productive!`
- guilt-oriented warnings
- motivational streak pressure

## 1.5 Direct manipulation over modal dialogs

If an operation can be completed through drag, inline edit, popover, or inspector, do not open a large modal.

Large modal dialogs are reserved for destructive confirmation, import/restore, or genuinely complex configuration.

## 1.6 Keyboard-first, mouse-complete

Power users should be able to move quickly with keyboard shortcuts, but every action must remain discoverable and fully usable with pointer input.

## 1.7 Data belongs to the user

V1 is local-first. Export/import is a first-class capability, not an afterthought.

---

# 2. V1 information architecture

## 2.1 Default sidebar

```text
Today
Inbox
Calendar
Goals

PINNED
<user-pinned projects>

INSIGHTS
Analytics
Review

Settings
```

Rules:

- `Projects` is **not** a default top-level sidebar item.
- Specific projects can be pinned.
- Sidebar can collapse to icons.
- Sidebar remembers collapsed state.
- `Inbox` badge shows only the **Unsorted** count.

## 2.2 Global surfaces

Available from every route:

- Command Menu — `Ctrl/Cmd + K`
- Instant Capture — `Ctrl/Cmd + Shift + Space`
- Inspector panel
- Running Session indicator/timer
- Undo toast
- Global search

---

# 3. Design system

## 3.1 Visual direction

Reference direction: **Linear-like clarity with a softer personal workspace feel**.

Default appearance:

- Light theme first
- Cool white background
- Near-white primary surfaces
- Subtle cool-gray secondary surfaces
- Near-black primary text
- Neutral secondary text
- Very weak borders
- Indigo global accent
- Project colors used sparingly
- Minimal shadows
- Large whitespace balanced with relatively high information density

Reference images:

- `docs/design/reference/today.png`
- `docs/design/reference/calendar.png`
- `docs/design/reference/inbox.png`
- `docs/design/reference/goals.png`
- `docs/design/reference/project.png`
- `docs/design/reference/analytics.png`
- `docs/design/reference/review.png`
- `docs/design/reference/settings.png`

Important: images are visual references. Written interaction rules in this document override any mismatched content in generated images.

## 3.2 Accent and project colors

Global accent: Indigo.

Project/Goal colors:

- Used for small dots
- Thin rails
- Progress accents
- Calendar plan/actual blocks
- Small chart marks

Do not paint entire pages or large cards using project colors.

## 3.3 Cards

Use light cards only for:

- Focus tasks
- Weekly Snapshot
- Metric summaries
- Selected overview modules
- Floating surfaces

Prefer list/section layout for:

- Ordinary tasks
- Inbox items
- Settings rows
- Project task lists
- Activity/history
- Goal supporting information

## 3.4 Radius

- Main cards: 10–12 px
- Timeline blocks: 6–8 px
- Controls: 7–10 px depending on size
- Pills: fully rounded only where semantically appropriate

## 3.5 Shadows

Default content surfaces should rely on border/surface contrast.

Use more visible shadows only for:

- Command Menu
- Floating Timer
- Inspector
- Drag overlay
- Popovers

## 3.6 Typography

Use a modern rational sans-serif stack. Preferred implementation:

```css
font-family: "Inter", "Geist", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Do not bundle commercial font files.

## 3.7 Icons

Use one consistent line-icon set. V1: Lucide React.

- 1.5–1.75 px stroke feel
- No mixing multiple icon libraries
- Selected navigation state uses tint/background, not random filled replacements

## 3.8 Priority presentation

Default values:

- Urgent
- High
- Medium
- Low
- None

Visual treatment:

- Urgent: visible red marker
- High: restrained red/orange marker
- Medium: weak orange marker
- Low: gray
- None: muted gray

Only Urgent and High should draw strong attention by default.

## 3.9 Motion

Motion settings:

- Reduced
- Subtle
- Balanced — default
- Expressive

Balanced target durations:

- Fast: ~160 ms
- Normal: ~220 ms
- Slow: ~280 ms

Animation language:

- Spring-based layout movement
- Shared layout transitions
- Opacity
- Small scale transitions (~0.98 → 1)
- Height transitions
- Positional continuity

Avoid:

- Gratuitous parallax
- bouncing UI everywhere
- long easing that delays work
- animated gradients as primary feedback

More expressive motion may be used only for:

- Goal completion
- Daily Close completion
- Weekly Review completion
- Streak milestone

Respect `prefers-reduced-motion` and map it to Reduced unless the user explicitly overrides.

---

# 4. Today — execution workspace

## 4.1 Purpose

Today answers:

> What matters now, and how is today actually unfolding?

Default desktop view: **Split**.

Left side: what to do.
Right side: when it is planned and when it actually happened.

## 4.2 Default module order

1. Weekly Focus
2. Focus
3. Next Up
4. Timeline
5. Unscheduled

Today modules are customizable but only within a constrained grid system.

Allowed Today customization:

- show/hide widget
- reorder widget
- Focus count
- left/right ratio
- Timeline height
- default Today view
- Weekly Focus visible Goal count
- show/hide Next Up
- show/hide Context Line

Not allowed:

- free pixel positioning
- arbitrary nesting
- custom HTML
- unlimited columns
- dashboard-builder behavior

## 4.3 Header

Default:

```text
Today
Friday, Aug 21
2 priorities remaining.
```

Right side:

```text
Split | List | Timeline      Customize
```

Context Line is factual and derived from current state.

Examples:

- `3 priorities today.`
- `Run47 is in progress.`
- `2 priorities remaining.`
- `Focus complete.`
- `Review ready.`

## 4.4 Weekly Focus

Default compact horizontal form:

```text
PPP Research 72%   FixOnce 45%   Fitness 3/4
```

Hover/click reveals more detail.

Weekly Focus is not a bookmark. It influences:

- Today display
- Next Up recommendation
- Analytics context
- Weekly Review
- next-week planning

## 4.5 Focus

Default count: 3.
Allowed setting: 1–5.

Focus items have explicit rank:

1. highest
2. second
3. third

Drag reorder updates rank.

If Focus is full and another task is added, show lightweight Replace UI rather than silently exceeding the configured count.

Completed Focus behavior:

- Configurable
- Default: keep completed Focus visible for the rest of the day
- User may choose auto-collapse to Completed

Focus tasks use light cards. Ordinary tasks use rows.

## 4.6 Next Up

Show exactly one recommendation.

Recommendation inputs:

- Due date proximity
- Scheduled date
- Priority
- Weekly Focus relation
- Number of reschedules
- Estimated duration vs available gap
- Existing Calendar plan

Display one short reason by default.
Detailed scoring can appear on hover/inspector.

Actions:

- Start
- Schedule
- Dismiss

Dismiss requests the next suggestion. It does not mutate the task.

## 4.7 Unscheduled

Contains tasks chosen for Today but without a planned time block.

Task can be dragged directly to the Timeline.

If task has estimate:

- use estimate as initial block length

If task has no estimate:

- create 30-minute block
- immediately show resize affordance

No confirmation modal.

## 4.8 Today views

### Split — default

Tasks + Timeline.

### List

Timeline collapses. Task workspace fills page.

### Timeline

Timeline expands. Tasks become a narrow drawer.

Remember user's last view.

## 4.9 Today Timeline

Same underlying component as Calendar Day.

Default dynamic visible range:

- start one hour before earliest relevant block when reasonable
- include expected working window
- expand when content falls outside the current range

Grid:

- visually 30-minute intervals by default
- drag snapping to 5 or 15 minutes according to settings

Plan:

- low-opacity Ghost block

Actual:

- solid block

Plan and Actual use the same Project color family.

## 4.10 Session timer

Running session indicator appears in Sidebar by default.
Click expands Floating Timer.

Timer actions:

- Pause
- Resume
- Finish
- Adjust

Timer rules:

- One running foreground/Active timer at a time
- Multiple Background sessions may run
- Manually logged Active sessions may overlap; show weak overlap indicator
- Paused time does not count as Active time
- Keep elapsed duration and Active duration separately

If timer runs unusually long:

```text
Run47 has been active for 3h 42m.
Still working | Adjust
```

Never auto-stop it.

---

# 5. Calendar — time management workspace

## 5.1 Purpose

Calendar answers:

> How did I allocate time, and how did reality differ?

Views:

- Day
- Week
- Agenda

First launch defaults to Week.
Afterward remember last view.

## 5.2 Week configuration

- Default 7 days
- User can choose 5 or 7
- Week start configurable

## 5.3 Planning side panel

Default expanded on desktop.
Can collapse and remember state.

Contains:

- Capacity summary
- Time Allocation summary
- Unscheduled tasks

Tasks can be dragged from the side panel into Calendar.

## 5.4 Plan / Actual filter

```text
Plan + Actual — default
Plan
Actual
```

## 5.5 Plan vs Actual visual rule

Plan: low-opacity Ghost using project color.
Actual: solid version of same color.

When both overlap, actual block may be offset slightly so both remain visible.

No two separate calendars.

## 5.6 Block content responsiveness

Content adapts to available height.

Very short block:

```text
PPP Analysis
```

Medium:

```text
PPP Analysis
45m
```

Large:

```text
PPP Analysis
PPP Research · 1h30m
```

## 5.7 Project colors

Calendar block primary color comes from Project.
Task does not have independent arbitrary color.

No Project:

- global Accent or neutral palette

## 5.8 Empty-area creation

Drag across empty time range to create a block.

Inline popover:

```text
14:00–15:30
Search task or type activity…

<matching task>
+ Create task
+ Focus block
+ Activity
```

No full modal.

## 5.9 Focus Blocks

Special planned reservation not requiring a Task.

Examples:

- Deep Work
- Admin
- Exercise
- Personal

Use neutral indigo-gray and subtle patterned/ghost treatment.

A Focus Block is a time budget, not completion work.

## 5.10 Repeating blocks

Recurring Schedule is separate from Recurring Task.

Support V1 recurrence:

- Daily
- Weekdays
- Weekly on selected weekdays
- Custom interval
- Optional end date

Use recurrence series and materialized occurrences.

## 5.11 Overlaps

Plan overlap:

- allowed
- weak `Schedule overlap` indicator

Actual overlap:

- allowed
- Active vs Background distinguished

## 5.12 Background Track

Background sessions appear in a narrow separate track on the right of the time grid.

Hide the track if no background sessions exist.

Background duration is not added to primary Active-time totals by default.

## 5.13 Current-time marker

Show Indigo now-line only in:

- Today Timeline
- Calendar Day
- current day column in Calendar Week

## 5.14 Daily Capacity

User may configure:

- weekday defaults
- weekend defaults
- per-day override

Example header:

```text
MON 17
6h20 / 8h
```

Over capacity:

```text
9h10 / 8h
```

Do not make it a red alarm.

## 5.15 Allocation drawer

Optional drawer shows time allocation by Project/Goal.

Not permanently visible in the main Calendar grid.

## 5.16 External calendar

V1 architecture must include an `external_event` concept and UI slot.

Do not implement provider connection in V1.

Future behavior:

- Google Calendar / Outlook event display
- external event read-only by default
- Convert to Task
- Track as Session

## 5.17 Inspector

Click a plan/session block to open ~360 px right inspector.

Show:

- Task/activity
- Plan start/end/duration
- Actual start/end/active duration
- Difference
- Project
- Status/priority where relevant
- Notes
- Open full task

Inspector should overlay/shift minimally, not collapse Calendar into unusable width.

---

# 6. Inbox — universal capture

## 6.1 Principle

Capture in ~3 seconds. Organize later.

## 6.2 Capture vs Create

### Instant Capture

`Ctrl/Cmd + Shift + Space`

Minimal bar:

```text
What's on your mind?
```

Enter sends raw item to Inbox with no required metadata.

### Command Menu Create

`Ctrl/Cmd + K`

Explicit actions:

- Create Task
- Add Note
- Start Session
- Search
- Navigate
- other commands

## 6.3 Inbox item modes

Supporting capture modes:

- Unsorted
- Note
- Idea
- Link

Default Instant Capture produces Unsorted.

Idea is not a new core object. It is a capture state that may later become a Task, Note, Project, Someday item, Archive, or be deleted.

Link is recognized from URL input.

## 6.4 URL handling

When raw capture is a URL:

- recognize URL
- store URL
- best-effort title/domain/favicon metadata
- do not implement expensive web scraping in V1

## 6.5 Note boundary

Formal Note supports:

- title
- Markdown body
- Goal/Project/Task relation
- tags

Do not build:

- graph view
- block editor
- wiki backlinks
- Notion-like databases

## 6.6 Attachments

Data architecture reserves Attachment metadata.
V1 UI does not expose attachment upload.

## 6.7 Default sorting

Newest first, grouped by date.

Optional sort:

- Newest
- Oldest

No Pin for Inbox.

Important items should be converted/scheduled instead of pinned inside Inbox.

## 6.8 Inbox tabs

```text
Unsorted
Someday
Archived
```

`Someday` means the user has intentionally kept something without a time commitment.
It is no longer an unresolved Inbox decision.

Someday view may include:

- capture items in someday state
- tasks with planning bucket `someday`

## 6.9 Process Inbox

Dedicated continuous processing mode.

For each item offer:

- Task
- Note
- Idea
- Today
- This Week
- Someday
- Archive
- Delete

After processing, advance to next item.

Keyboard examples:

- `T` Task
- `N` Note
- `I` Idea
- `1` Today
- `2` This Week
- `3` Someday
- `A` Archive
- `X` Delete
- `J/K` next/previous

## 6.10 Archive vs Delete

Archive retains content without requiring action.
Delete moves to Trash.
Trash retains data for 30 days before permanent deletion eligibility.

## 6.11 Someday resurfacing

Weekly Review may surface 1–3 old Someday items:

```text
Still relevant?
Keep | Move to this week | Archive
```

No forced action.

## 6.12 Natural-language suggestions

Capture parser may detect dates/time/priority/duration/project.

If uncertain:

```text
Detected date: Fri, Aug 21
Set due date
```

Do not silently mutate from ambiguous language.

## 6.13 Empty state

Preferred:

```text
Nothing to process.
```

No celebration copy.

---

# 7. Goal

## 7.1 Role

Goal is direction, not micro-management.

## 7.2 Goal list views

- Overview — default
- Compact

Remember user's last choice.

## 7.3 Goal tracking mode

Goal creation asks:

```text
How do you want to track this?
- Projects & tasks
- A metric
- Manually
- No progress
```

Underlying modes:

- projects
- tasks
- metric
- manual
- none

Ongoing goals should not be forced into a percentage.

Example:

```text
Stay Consistent With Training
3 / 4 sessions this week
12 week streak
```

## 7.4 Goal status

Fixed semantic set:

- Active
- Paused
- Completed
- Archived

Do not allow arbitrary Goal workflow states in V1.

## 7.5 Why / Context

Optional text, collapsed by default.

## 7.6 Project relation

Project has:

- zero or one Primary Goal
- zero or many Related Goals

Navigation hierarchy uses Primary Goal.
Analytics may optionally use Related Goals, but primary time allocation must avoid double-counting.

## 7.7 Goal Detail

Overview-first:

- title/status
- Why/Context
- progress or metrics
- Projects
- Milestones summary
- This week
- Recent activity

Do not expand every Task directly on Goal page.

## 7.8 Weekly Focus

`Set as weekly focus` affects the current week's focus record and related recommendation/review behavior.

---

# 8. Project

## 8.1 Project may exist without Goal

Standalone projects are valid.

## 8.2 Project default header

Show only core context:

- title
- project status
- deadline
- Primary Goal
- progress
- task summary
- current-week actual time

## 8.3 Views

V1:

- List — default
- Board

Future:

- dedicated Timeline
- Project Calendar

## 8.4 List

Linear-like light rows.

Default columns:

- Task
- Status
- Priority
- Due
- Estimate

User may:

- show/hide fields
- reorder columns
- resize columns

Do not turn rows into thick cards.

## 8.5 Board

Columns come from Project task workflow.

Task cards remain visually light.

## 8.6 Project workflow

Project status can be customized.
Default project statuses:

- Planned
- Active
- On hold
- Completed
- Cancelled

Task workflow may be global or project-specific.

## 8.7 Milestones

Milestone is a formal V1 concept.

A milestone:

- belongs to Project
- has title
- optional target date
- status
- order
- may link multiple Tasks

It is not itself a Task.

Display as lightweight phase rail/sequence, not a full Gantt chart.

Clicking a Milestone filters linked Tasks.

## 8.8 Project Overview

Default modules:

- Progress
- Milestones
- This week: plan / actual
- Recent activity
- Upcoming

Do not duplicate full Analytics.

## 8.9 Custom fields

Manage through Project Settings/Fields rather than primary screen.

Support field types:

- Status
- Priority
- Tag
- Date
- Number
- Single select
- Multi-select
- Text
- Checkbox

Scopes:

- Global
- Project-local

Progressive disclosure: default users should not need to configure custom fields.

---

# 9. Task

## 9.1 Task may exist without Project

Valid examples:

- buy detergent
- pay bill
- make a call

## 9.2 Dates are distinct

### Due Date
Latest acceptable completion date.

### Scheduled Date
Day the user intends to work on it.

### Planned Session / Planned Block
Exact intended time interval.

Never conflate these.

## 9.3 Priority

- Urgent
- High
- Medium
- Low
- None

## 9.4 Status semantics

Default task statuses:

- Todo
- In Progress
- Waiting
- Done
- Cancelled

Names and number of statuses may be customized, but every workflow must preserve machine-readable semantics.

At minimum:

- one Open/Active semantic status
- one Completed semantic status

A user may rename `Done` to `Completed`, but Analytics must still know it means completed.

## 9.5 Estimate

Task estimate is total expected effort for the entire Task.

Example:

```text
Estimate: 3h
Planned blocks: 1h + 1h + 1h
Actual: 3h42m
```

## 9.6 Progress mode

Per Task:

- Binary
- Subtask progress
- Manual percent

## 9.7 Subtasks

Exactly one level.

A Subtask:

- is stored as Task with `parentTaskId`
- cannot itself have child Tasks
- may be scheduled separately
- may have Sessions
- contributes to parent Task aggregation when progress mode is Subtask

## 9.8 Planned sessions

A single Task may have many planned blocks across one or more days.

## 9.9 Matching Plan to Actual

When a Session starts/ends near a related planned block, the system may suggest/automatically pair it when confidence is high.

User may change the link from Inspector.

## 9.10 Task completion with future plans

If future planned blocks remain:

```text
Task completed.
1 future planned session remains.
Remove plan | Keep plan
```

Default recommendation: Remove plan.
Do not silently delete.

## 9.11 Inspector-first

Most edits happen in right Inspector:

- title
- status
- priority
- Project
- Due
- Scheduled
- Estimate
- Actual
- Subtasks
- Sessions
- Notes/context
- custom fields

`Open full task` enters Task Detail for deep editing/history.

## 9.12 Activity history

Store history append-only.
UI defaults collapsed.

Examples:

- created
- priority changed
- rescheduled
- completed
- reopened
- session started/ended
- plan created/moved/deleted

## 9.13 Reschedule reason

Optional reasons:

- No time
- Blocked
- Priority changed
- Overplanned
- Other

Never require a reason.

## 9.14 Templates

V1 Task Template is lightweight:

- save field configuration/default values
- reuse it when creating Task

No marketplace/public sharing.

Project Templates are deferred until after V1.

---

# 10. Session

## 10.1 Role

Session represents actual execution.

A Session may be linked to:

- Task/Subtask
- Planned block
- Project
- nothing (independent Activity)

## 10.2 Session kinds

- Active
- Background

Primary analytics count Active duration.
Background duration is reported separately by default to prevent double counting.

## 10.3 Timer sessions

State model:

```text
idle → running → paused → running → finished
```

Store active/paused segments separately.

## 10.4 Manual sessions

User may add after the fact.

Allow overlap.
Weakly warn about overlapping Active sessions but do not block.

## 10.5 Unplanned

A Session with no matching planned block is `Unplanned` for Plan-vs-Actual analytics.

Do not style it as an error.

---

# 11. Daily Close

## 11.1 Trigger

Two entry paths:

- manual `Close today`
- quiet contextual prompt near configured day-end

User configures when their day changes, e.g. 04:00.

## 11.2 Flow

1. Resolve
2. Reflect
3. Close

Target completion time: 1–3 minutes.

### Resolve

For unfinished Today tasks:

- complete
- reschedule
- move back to week
- someday
- cancel/archive where relevant

### Reflect

Optional note:

```text
What happened today?
```

Automatically show factual summary:

- tasks completed
- active time
- unplanned time
- rescheduled tasks

### Close

Create immutable Daily Review revision/snapshot.

---

# 12. Analytics

## 12.1 Principle

Analytics is for observing facts at any time.
Review is a deliberate ritual.

## 12.2 Default period

First use: This Week.
Then remember user's last selected range.

Ranges:

- Today
- This Week
- Last Week
- This Month
- Last 30 Days
- Quarter
- Year
- Custom

## 12.3 Default overview

- Completion
- Actual time
- Planned time
- Goals progressed
- Planning accuracy

## 12.4 Prior-period context

Allow weak comparison with previous equivalent period.

Do not use aggressive red/green KPI design.

## 12.5 Completion rate

Only Tasks count.

Default period completion rate:

```text
Tasks scheduled for the period and completed by period end
----------------------------------------------------------
Tasks scheduled for the period excluding cancelled tasks
```

Also show absolute completed count separately.

Subtasks do not independently inflate headline Task completion unless explicitly filtered to Subtasks.
Milestones are separate.
Sessions do not count as task completions.

## 12.6 Actual time

Headline Actual Time = sum of **Active Session active segments** in period.

Background time shown separately.

## 12.7 Planned time

Sum of planned block durations intersecting period, excluding cancelled/deleted plans.

## 12.8 Planning Accuracy

Show components plus a weak overall score.

### Time accuracy

For each linked Plan/Actual pair:

```text
accuracy = 1 - abs(actualDuration - plannedDuration) / max(actualDuration, plannedDuration)
```

Clamp to 0–1.
Aggregate weighted by planned duration.

### Schedule accuracy

Headline component = percentage of linked sessions starting within user/default tolerance of planned start.
Default tolerance: 15 minutes.

Also expose start-delay distribution separately.

### Completion accuracy

Same as period scheduled-task completion rate.

### Overall planning accuracy

Mean of available normalized components:

- Time accuracy
- Schedule accuracy
- Completion accuracy

Do not overemphasize Overall. Tooltip must explain formula.

## 12.9 Rescheduling

Show:

- event count
- reasons
- most-rescheduled Tasks

No blame language.

## 12.10 Unplanned work

First-class metric:

- unplanned Active duration
- percentage of Active time
- list of largest unplanned sessions

## 12.11 Capacity

Second-layer default widget.

Per day show:

- capacity
- planned
- actual
- number of days planned above capacity

## 12.12 Time Allocation

Switch dimension:

- Goal
- Project
- Tag
- Custom Field
- Priority

Rules:

- Allocation uses Active time
- Goal allocation defaults to Primary Goal to avoid double counting
- Related Goals can be optionally included in a separate exploratory mode

## 12.13 Activity by time of day

Show distribution of Active work by hour/daypart.

Do not label periods as “productive” without a user-defined metric.

## 12.14 Start delay

For linked planned/actual sessions:

- median delay
- average delay
- on-time percentage
- <15 min late
- 15–30 min late
- >30 min late

## 12.15 Estimate accuracy

For completed Tasks with Estimate and actual Active time:

```text
errorRatio = (actual - estimate) / estimate
```

Default buckets:

- Accurate: abs(errorRatio) <= 15%
- Underestimated: errorRatio > 15%
- Overestimated: errorRatio < -15%

Show average signed error and preferably median absolute error.

## 12.16 Analytics customization

Widgets may be:

- added/removed
- reordered
- resized only to predefined grid sizes

Always offer Reset to Default.

---

# 13. Weekly Review

## 13.1 Review home

If current week not completed:

```text
Weekly Review
Ready to review
Aug 17–23
Start review
```

If completed:

```text
Week 34
Completed Aug 23
View snapshot
```

Below: review history.

## 13.2 Flow

1. Overview
2. Plan vs Actual
3. Goals
4. Patterns
5. Reflection
6. Next Week

## 13.3 Overview

Show concise facts:

- completed Tasks
- Active time
- completion rate
- unplanned time
- Goals progressed

## 13.4 Plan vs Actual

Show:

- planned vs actual time
- schedule adherence
- capacity
- major plan gaps

## 13.5 Goals

Per Goal:

- progress change where meaningful
- Active time
- completed tasks
- next milestone
- keep as focus next week? yes/no

## 13.6 Patterns

Show:

- reschedule reasons
- most rescheduled
- estimate error
- start delay
- unplanned work
- time distribution

Only factual description.

## 13.7 Reflection

Default template:

- What worked?
- What could be improved?
- What will I do differently?

User may customize Reflection template.

## 13.8 Next Week

Do not schedule every day.

Choose:

- up to configured Weekly Focus goals
- weekly metrics

Example:

- Deep work 15h
- Fitness 4 sessions
- Reading 200min

Daily planning happens later.

## 13.9 Someday resurfacing

Optionally show 1–3 stale Someday items for Keep / This Week / Archive.

## 13.10 Weekly Story

V1 uses deterministic rules, no AI API.

### Before review

Generate Data Summary from facts.

### After review

Generate editable Weekly Story from facts + Reflection.

Story must be editable before completion.

## 13.11 Snapshot and revisions

Review completion creates an immutable revision containing a snapshot of metrics and narrative at that moment.

If user reopens:

- draft starts from latest revision
- completing again creates revision N+1
- retain prior revisions
- show updated timestamp

Historical snapshot does not change when underlying Tasks are later edited.

## 13.12 Skip

User may skip Weekly Review.

Analytics still exists.
No Reflection/Story snapshot is generated unless they complete the review.

---

# 14. Settings and customization

V1 sections:

## Appearance

- Light / Dark / System
- Indigo Accent choices
- Project/Goal colors
- Comfortable / Compact density

## Motion

- Reduced
- Subtle
- Balanced
- Expressive

## Today

- default view
- Focus count
- widgets/order
- Weekly Focus count
- Next Up on/off
- Context Line on/off

## Calendar

- Day / Week / Agenda last-view behavior
- 5/7 day preference
- week start
- visible time range
- snap 5/15 min
- daily capacity defaults
- day-start cutoff

## Workflow

- Task workflow/statuses
- Project workflow/statuses
- custom fields
- reschedule reasons

## Templates

- Task templates
- Review reflection templates

## Data

- Export JSON
- Import/restore JSON
- Backup reminder frequency
- Reset demo data/dev-only

Every customizable layout must expose Reset to Default.

---

# 15. Command Menu and Search

## 15.1 Command Menu

`Ctrl/Cmd + K`

One surface for:

- Search
- Create
- Navigate
- Operate

Examples:

- Create Task
- Start Session
- Add Note
- Complete selected Task
- Open Review
- Go to PPP Research
- Search Run47

## 15.2 Suggested keyboard shortcuts

When a task is selected:

- `C` complete
- `S` start session
- `E` edit
- `F` add/remove Focus
- `P` schedule
- `R` reschedule
- `J/K` move selection
- `Enter` open
- `Esc` close current overlay

Do not capture shortcuts while user is typing into inputs/textareas/contenteditable.

## 15.3 Search scope

V1 searches:

- Goal title/context
- Project title/description
- Task title/description
- Note title/body
- Tags
- Project/Goal names

Do not index Sessions into global text search by default.

---

# 16. Quick Add parser

## 16.1 No AI dependency

Use deterministic parser and field-level confidence.

Example:

```text
明天 3pm 修改 Run47 图 45m high #PPP
```

Potential parse:

- title: 修改 Run47 图
- scheduledDate: tomorrow
- plannedStart: 15:00
- estimate: 45m
- priority: High
- project alias: PPP

## 16.2 Supported V1 tokens

English/Chinese basics:

Dates:

- today / 今天
- tomorrow / 明天
- weekday names / 周一…周日
- YYYY-MM-DD
- M/D where unambiguous

Time:

- 3pm / 15:00 / 下午3点

Duration:

- 45m / 45min / 45分钟
- 2h / 2小时

Priority:

- urgent
- high
- medium
- low
- 中文 aliases

Project:

- `#ProjectAlias`

## 16.3 Apply policy

High-confidence exact tokens may be pre-filled.
Ambiguous date/project matches are suggestions requiring user confirmation.

---

# 17. Weekly Story rule engine

V1 generates factual templates.

Inputs:

- top Project by Active time
- top Goal progress
- completed Tasks
- Active time
- unplanned ratio
- Planning Accuracy
- top reschedule reason
- estimate error
- Reflection text

Sentence rules should be independent and ordered by importance.

Examples:

```text
Most active time this week was spent on PPP Research (10h 20m).
4h 20m of active time was unplanned.
The most common reschedule reason was Overplanned.
Median start delay was 18 minutes.
```

Do not generate conclusions such as “you were more disciplined” unless directly and transparently defined by user metrics.

Future AI summaries may plug into the same Story interface without replacing stored facts.

---

# 18. Local-first technical baseline

## 18.1 Runtime/tooling baseline

Recommended frozen baseline for initial implementation:

- Node.js 24 LTS
- npm 11
- React 19.2.x
- React DOM 19.2.x
- Vite 8.1.x
- TypeScript **6.0.x**
- React Router 8.x in client/declarative SPA usage
- Tailwind CSS 4.3.x
- Motion 13.x
- Dexie 4.4.x
- dexie-react-hooks
- Zustand 5.x for transient UI state only
- dnd-kit new React API (`@dnd-kit/react`), not legacy `@dnd-kit/core` API
- date-fns 4.x + `@date-fns/tz`
- Recharts 3.x
- Zod 4.x
- React Hook Form
- Radix Primitives for accessible low-level overlays/menus/selects
- Lucide React 1.x
- Vitest 4.x
- Testing Library
- Playwright 1.62+
- ESLint 10.x
- typescript-eslint current stable compatible with TypeScript 6
- Prettier 3.x

Why TypeScript 6 instead of 7 initially: TypeScript 7 is stable, but the currently documented `typescript-eslint` supported TypeScript range remains `<6.1.0`. V1 prioritizes a stable lint/type-check pipeline. Revisit TS7 when the lint ecosystem officially supports it.

## 18.2 Version policy

- Commit `package-lock.json`.
- Do not use floating `latest` in committed package.json.
- Patches/minors may be updated only with green tests.
- Do not perform a major upgrade during feature work.
- Major dependency upgrade requires a short ADR in `docs/DECISIONS.md`.

## 18.3 Why Vite SPA, not SSR/full-stack framework

V1 has:

- no server rendering need
- no authenticated backend
- no SEO-critical public content
- a local IndexedDB-centric runtime

Vite keeps the client architecture direct and minimizes accidental backend complexity.

## 18.4 Persistent vs transient state

### Dexie owns persistent domain state

Do not duplicate persistent Tasks/Projects/Sessions as a second source of truth in Zustand.

Use `useLiveQuery()` or repository hooks/services.

### Zustand owns transient UI/application state

Examples:

- sidebar collapsed
- current inspector entity
- Command Menu open state
- selected row
- drag state
- current Today view if not yet persisted
- undo stack
- ephemeral timer UI tick

Persisted user settings still belong in Dexie.

## 18.5 No direct DB writes from React components

Components call domain commands/services.

Good:

```ts
await taskCommands.rescheduleTask(...)
```

Bad:

```ts
await db.tasks.update(...)
```

inside a component.

Command layer responsibilities:

1. validate input
2. write domain mutation transactionally
3. append activity event
4. create undo information where supported
5. trigger derived updates if required

---

# 19. IndexedDB / Dexie schema

All major records contain `workspaceId` even though V1 exposes one workspace.

Use string UUIDs generated with `crypto.randomUUID()`.

All timestamps are ISO UTC strings or epoch milliseconds consistently. Recommended storage: epoch milliseconds for indexed timestamp fields; date-only values stored as canonical `YYYY-MM-DD` in user's logical calendar.

## 19.1 Core tables

Suggested Dexie tables:

```text
workspaces
workspaceSettings
goals
projects
projectGoalLinks
milestones
milestoneTaskLinks
workflows
workflowStatuses
tasks
tags
customFieldDefinitions
customFieldValues
plannedBlocks
recurrenceSeries
sessions
sessionSegments
inboxItems
notes
attachments
weeklyFocus
dailyFocus
metricDefinitions
metricEntries
activityEvents
reviews
reviewRevisions
templates
externalEvents
```

## 19.2 Base fields

Most mutable entities:

```ts
interface BaseEntity {
  id: string;
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number;
  deletedAt?: number;
}
```

Append-only entities such as ActivityEvent and ReviewRevision do not need `updatedAt` semantics.

## 19.3 Workspace

```ts
interface Workspace {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}
```

V1 creates exactly one default workspace.

## 19.4 Workspace settings

Include:

- theme: light/dark/system
- accent token
- density
- motion level
- timezone
- locale
- weekStartsOn
- dayStartMinutes
- default weekday/weekend capacity
- per-day capacity overrides
- Today layout config
- Calendar config
- Review config
- backup reminder

## 19.5 Goal

```ts
interface Goal extends BaseEntity {
  title: string;
  context?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  trackingMode: 'projects' | 'tasks' | 'metric' | 'manual' | 'none';
  manualProgress?: number;
  deadline?: string;
  colorToken?: string;
}
```

## 19.6 Project

```ts
interface Project extends BaseEntity {
  title: string;
  description?: string;
  primaryGoalId?: string;
  projectStatusId: string;
  taskWorkflowId: string;
  deadline?: string;
  colorToken?: string;
  progressMode: 'tasks' | 'milestones' | 'manual' | 'none';
  manualProgress?: number;
}
```

Related Goals use `projectGoalLinks`.

## 19.7 Workflow

```ts
interface Workflow extends BaseEntity {
  scope: 'task' | 'project';
  projectId?: string;
  name: string;
}

interface WorkflowStatus extends BaseEntity {
  workflowId: string;
  name: string;
  semantic: 'open' | 'active' | 'waiting' | 'completed' | 'cancelled';
  order: number;
  colorToken?: string;
}
```

Validation:

- each Task workflow must have at least one non-completed state
- each Task workflow must have at least one `completed` semantic state

## 19.8 Task

```ts
interface Task extends BaseEntity {
  projectId?: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  statusId: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  progressMode: 'binary' | 'subtasks' | 'manual';
  manualProgress?: number;
  estimateMinutes?: number;
  dueDate?: string;
  scheduledDate?: string;
  planningBucket?: 'someday';
  tagIds: string[];
}
```

Constraint: if `parentTaskId` exists, parent must have `parentTaskId == null`.

## 19.9 Milestone

```ts
interface Milestone extends BaseEntity {
  projectId: string;
  title: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  targetDate?: string;
  order: number;
}
```

Task relation is many-to-many via link table.

## 19.10 Custom fields

```ts
type CustomFieldType =
  | 'status'
  | 'priority'
  | 'tag'
  | 'date'
  | 'number'
  | 'singleSelect'
  | 'multiSelect'
  | 'text'
  | 'checkbox';

interface CustomFieldDefinition extends BaseEntity {
  scope: 'global' | 'project';
  projectId?: string;
  entityType: 'task' | 'project';
  name: string;
  type: CustomFieldType;
  configJson: unknown;
  order: number;
}
```

Values stored separately to avoid constantly reshaping Task records.

## 19.11 Planned block

```ts
interface PlannedBlock extends BaseEntity {
  taskId?: string;
  type: 'task' | 'focus' | 'activity';
  title?: string;
  projectId?: string;
  startAt: number;
  endAt: number;
  recurrenceSeriesId?: string;
  recurrenceOccurrenceKey?: string;
}
```

## 19.12 Recurrence series

V1 may store normalized rule fields rather than arbitrary RFC RRULE if that simplifies implementation.

```ts
interface RecurrenceSeries extends BaseEntity {
  frequency: 'daily' | 'weekly';
  interval: number;
  weekdays?: number[];
  startsOn: string;
  endsOn?: string;
  sourceTemplateJson: unknown;
}
```

Materialize occurrences for a rolling window and regenerate safely.

## 19.13 Session

```ts
interface Session extends BaseEntity {
  taskId?: string;
  plannedBlockId?: string;
  projectId?: string;
  title?: string;
  kind: 'active' | 'background';
  source: 'timer' | 'manual';
  startedAt: number;
  endedAt?: number;
}
```

## 19.14 Session segments

```ts
interface SessionSegment {
  id: string;
  workspaceId: string;
  sessionId: string;
  type: 'active' | 'paused';
  startAt: number;
  endAt?: number;
}
```

Active duration = sum Active segments.
Elapsed duration = Session end-start.

## 19.15 Focus tables

```ts
interface DailyFocus {
  id: string;
  workspaceId: string;
  logicalDate: string;
  taskId: string;
  rank: number;
}

interface WeeklyFocus {
  id: string;
  workspaceId: string;
  weekKey: string;
  goalId: string;
  rank: number;
}
```

Focus belongs to a date/week, not permanently to Task/Goal.

## 19.16 Inbox item

```ts
interface InboxItem extends BaseEntity {
  rawText: string;
  capturedAt: number;
  kind: 'unsorted' | 'idea' | 'link';
  state: 'unsorted' | 'someday' | 'archived' | 'converted';
  url?: string;
  urlTitle?: string;
  urlDomain?: string;
  convertedEntityType?: 'task' | 'note' | 'project';
  convertedEntityId?: string;
}
```

## 19.17 Note

```ts
interface Note extends BaseEntity {
  title: string;
  bodyMarkdown: string;
  goalId?: string;
  projectId?: string;
  taskId?: string;
  tagIds: string[];
}
```

## 19.18 Attachment placeholder

```ts
interface Attachment extends BaseEntity {
  ownerType: 'inbox' | 'note' | 'task' | 'project';
  ownerId: string;
  fileName: string;
  mimeType?: string;
  size?: number;
  blobKey?: string;
}
```

V1 UI keeps attachment creation disabled.

## 19.19 Metric definition

```ts
interface MetricDefinition extends BaseEntity {
  ownerType: 'workspace' | 'goal';
  ownerId?: string;
  name: string;
  unit: 'count' | 'minutes' | 'hours' | 'percent' | 'custom';
  targetValue: number;
  period: 'day' | 'week' | 'month';
  source: 'sessionCount' | 'actualMinutes' | 'completedTasks' | 'manual';
  filterJson: unknown;
}
```

Manual metric values use `metricEntries`.

## 19.20 Activity event

Append-only:

```ts
interface ActivityEvent {
  id: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  occurredAt: number;
  actor: 'user' | 'system';
  payloadJson: unknown;
}
```

Event types include at least:

- TASK_CREATED
- TASK_UPDATED
- TASK_STATUS_CHANGED
- TASK_COMPLETED
- TASK_REOPENED
- TASK_RESCHEDULED
- TASK_ARCHIVED
- PLAN_CREATED
- PLAN_MOVED
- PLAN_RESIZED
- PLAN_DELETED
- SESSION_STARTED
- SESSION_PAUSED
- SESSION_RESUMED
- SESSION_FINISHED
- SESSION_ADJUSTED
- GOAL_FOCUS_SET
- DAILY_CLOSE_COMPLETED
- WEEKLY_REVIEW_COMPLETED

Activity Events are not a full event-sourced database; they are an immutable audit/history stream supporting analytics and historical context.

## 19.21 Review and revisions

```ts
interface Review extends BaseEntity {
  type: 'daily' | 'weekly';
  periodStart: number;
  periodEnd: number;
  status: 'draft' | 'completed' | 'reopened' | 'skipped';
  currentRevision: number;
}

interface ReviewRevision {
  id: string;
  workspaceId: string;
  reviewId: string;
  revision: number;
  createdAt: number;
  snapshotJson: unknown;
  reflectionJson: unknown;
  storyText?: string;
}
```

ReviewRevision is immutable.

## 19.22 Templates

```ts
interface Template extends BaseEntity {
  kind: 'task' | 'reviewReflection';
  name: string;
  payloadJson: unknown;
}
```

## 19.23 External events placeholder

```ts
interface ExternalEvent extends BaseEntity {
  provider: 'google' | 'outlook' | 'other';
  externalId: string;
  title: string;
  startAt: number;
  endAt: number;
  readOnly: boolean;
  rawJson?: unknown;
}
```

Do not implement provider sync V1.

---

# 20. Database indexing and migration rules

## 20.1 Index likely query keys

Examples:

- `[workspaceId+deletedAt]`
- `[workspaceId+scheduledDate]`
- `[workspaceId+projectId]`
- `[workspaceId+parentTaskId]`
- `[workspaceId+startAt]`
- `[workspaceId+logicalDate]`
- `[workspaceId+weekKey]`
- `[workspaceId+state]`
- `taskId`
- `plannedBlockId`
- `sessionId`
- `reviewId`
- `occurredAt`

Use Dexie compound/multiEntry indexes only where needed by real queries.

## 20.2 Migrations

- Every schema change increments Dexie version.
- No destructive migration without export backup option.
- Migration functions must have unit tests with old fixture data.
- Never delete old user records simply because a new feature no longer displays them.

---

# 21. Time model

## 21.1 Central Time Service

No feature code should independently invent day/week logic.

Create `TimeService` exposing:

- current instant
- user timezone
- logical date
- start/end of logical day
- start/end of week
- period keys
- convert date-only + local time → instant
- format date/time
- duration helpers

## 21.2 User timezone

Store explicit timezone identifier such as:

```text
Asia/Singapore
```

Use date-fns 4 + `@date-fns/tz`.

## 21.3 Day start

User setting `dayStartMinutes`.

Example 04:00:

A session at 02:00 Saturday still belongs to Friday's logical day.

All Today, Daily Close, Focus, and daily Analytics use logical day, not raw midnight.

## 21.4 Testing time

TimeService must allow injected/fake clock so tests never depend on actual wall clock.

---

# 22. Domain command architecture

Use services/commands as mutation boundary.

Recommended shape:

```text
taskCommands
projectCommands
planCommands
sessionCommands
inboxCommands
reviewCommands
settingsCommands
```

Example transaction:

```text
rescheduleTask(taskId, newScheduledDate, optionalReason)
  1. validate Task exists and not deleted
  2. capture previous state for undo
  3. update task scheduledDate
  4. append TASK_RESCHEDULED event with from/to/reason
  5. return undo command
```

All cross-table mutations use Dexie transaction.

---

# 23. Undo system

## 23.1 Scope

Session-memory undo stack; survives navigation but not browser restart.

At least support:

- move/reschedule Task
- Focus add/remove/reorder
- Calendar block move/resize
- archive
- Task complete/reopen
- delete to Trash

## 23.2 UI

```text
Task moved to tomorrow.    Undo
```

Toast disappears after a short window, but internal stack may retain last ~20 reversible commands until conflicting mutation makes them invalid.

---

# 24. Auto-save

No Save buttons for ordinary editing.

- inspector edits auto-save
- notes auto-save with debounce
- layout customization auto-save
- Review draft auto-saves

Review completion is explicit because it creates immutable revision.

Surface subtle `Saved` / `Saved 21:32` only where useful.

---

# 25. Backup and restore

## 25.1 Export

Settings → Data → Export.

Filename:

```text
tilo-backup-YYYY-MM-DD.json
```

Backup must contain:

- schema version
- app version
- exportedAt
- workspace
- all data tables

## 25.2 Import

Validate JSON with Zod before any write.

Restore flow:

1. parse
2. verify schema version
3. migrate in-memory if supported
4. show summary
5. user confirms
6. transactional replace/merge according to chosen restore mode

V1 may initially support Replace Workspace only.

## 25.3 Backup reminder

User options:

- 7 days
- 14 days
- 30 days
- Off

Message remains factual.

---

# 26. Trash and deletion

Mutable content lifecycle:

```text
Active → Archived → Trash → Permanent deletion eligible
```

`deletedAt` marks Trash.

Default permanent deletion eligibility: 30 days.

V1 may provide manual `Empty trash` with confirmation instead of automatic background deletion, provided the UI states the retention policy clearly.

---

# 27. Responsive scope

Desktop-first.

## >=1280 px

- full Sidebar
- main workspace
- optional Inspector

## 900–1279 px

- collapsible Sidebar
- workspace
- Inspector may overlay

## <900 px

Basic usable layout only:

- compact/bottom navigation
- single-column content
- Inspector becomes full-screen sheet
- Calendar prioritizes Day view
- desktop drag workflows may have tap alternatives

V1 goal: **mobile usable, not mobile optimized**.

---

# 28. Accessibility

Required from V1:

- semantic HTML
- keyboard navigation
- visible focus states
- ARIA labels for icon buttons
- Radix primitives or equivalent accessible behavior for dialogs/popovers/menus
- Reduced Motion
- sufficient contrast
- no color-only state communication
- drag operations have keyboard/tap alternatives
- screen-reader labels for plan/actual blocks

---

# 29. Component architecture

## 29.1 App shell

- `AppShell`
- `Sidebar`
- `SidebarSection`
- `PinnedProjectItem`
- `CommandMenu`
- `CaptureBar`
- `InspectorShell`
- `FloatingTimer`
- `UndoToast`
- `GlobalShortcuts`

## 29.2 Shared UI

Build custom visual system over Radix primitives:

- Button
- IconButton
- Input
- Textarea
- Select
- Popover
- DropdownMenu
- Tooltip
- Tabs
- SegmentedControl
- Badge
- StatusPill
- PriorityMark
- ProgressBar
- ProgressRing
- EmptyState
- SectionHeader
- ContextMenu
- Sheet/Inspector

Do not import a pre-styled component kit whose visual language overrides the product references.

## 29.3 Task components

- TaskRow
- FocusCard
- TaskCheckbox
- TaskMeta
- TaskInspector
- TaskDetailPage
- SubtaskList
- TaskFieldEditor
- ReschedulePopover

## 29.4 Timeline/Calendar components

One shared timeline engine:

- TimeGrid
- TimeRuler
- DayColumn
- WeekGrid
- PlannedBlockView
- ActualSessionView
- BackgroundTrack
- NowLine
- CapacityHeader
- TimelineSelection
- TimelineDragOverlay
- BlockInlineCreator
- TimelineInspector

Today and Calendar must reuse this engine.

## 29.5 Inbox

- InboxList
- InboxItemRow
- InboxInspector
- ProcessInboxMode
- CaptureDropZone placeholder
- SomedayList

## 29.6 Goal/Project

- GoalRow
- GoalCompactRow
- GoalProgressRenderer
- GoalInspector/Detail
- ProjectHeader
- ProjectOverview
- ProjectTaskList
- ProjectBoard
- MilestoneRail
- FieldsManager

## 29.7 Analytics

- MetricCard
- PlanActualChart
- AllocationChart
- CapacityChart
- StartDelayCard
- EstimateAccuracyChart
- RescheduleCard
- UnplannedWorkCard
- AnalyticsGrid

## 29.8 Review

- ReviewHome
- ReviewStepper
- ReviewOverviewStep
- ReviewPlanActualStep
- ReviewGoalsStep
- ReviewPatternsStep
- ReviewReflectionStep
- ReviewNextWeekStep
- WeeklySnapshot
- ReviewHistory

---

# 30. Proposed source directory

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
    shortcuts.ts
  components/
    ui/
    shell/
  data/
    db/
      database.ts
      schema.ts
      migrations/
    repositories/
    backup/
  domain/
    models/
    commands/
    queries/
    validation/
  features/
    today/
    calendar/
    inbox/
    goals/
    projects/
    tasks/
    sessions/
    analytics/
    reviews/
    settings/
    command-menu/
  services/
    time/
    analytics/
    recommendation/
    quick-add/
    story/
    recurrence/
    search/
    undo/
  state/
    uiStore.ts
  styles/
    tokens.css
    theme.css
    global.css
  test/
    fixtures/
    factories/
    helpers/
    demo/
  main.tsx

e2e/
  today.spec.ts
  calendar.spec.ts
  inbox.spec.ts
  review.spec.ts
  backup.spec.ts

docs/
  MASTER_PLAN.md
  DECISIONS.md
  design/reference/

AGENTS.md
DEVELOPMENT_STATUS.md
ACCEPTANCE_CHECKLIST.md
```

Feature folders may contain local components/hooks, but shared primitives belong in `components/ui` and persistent data rules remain in domain/data layers.

---

# 31. Recommendation engine

V1 Next Up uses deterministic scoring.

Suggested inputs, normalized:

- due urgency
- is scheduled Today
- weekly Focus Goal relation
- priority
- reschedule count
- estimated duration fits next free gap
- already has a plan block (negative if already scheduled)
- dismissed in current session (exclude)

Output:

```ts
{
  taskId,
  score,
  primaryReason,
  reasons[]
}
```

Only one recommendation displayed.

Recommendation engine must be pure/testable and not directly query UI state.

---

# 32. Search service

V1 can use a lightweight local index built from Goal/Project/Task/Note records.

Requirements:

- case-insensitive
- normalize whitespace
- CJK-safe substring fallback
- weighted title > tag/project > description/body
- no Session indexing by default
- result grouped by entity type
- lazy refresh when relevant Dexie tables change

Do not over-engineer a search server.

---

# 33. Demo data

Implement `seedDemoData()`.

Must create a realistic multi-week workspace containing:

Goals:

- Complete Thesis
- Build FixOnce
- Stay Consistent With Training

Projects:

- PPP Research
- FixOnce
- Fitness

Data:

- tasks in mixed statuses
- Focus items
- planned blocks
- actual sessions
- some late starts
- some unplanned sessions
- background sessions
- reschedules with reasons
- milestones
- one Weekly Review history revision

Developer-only setting:

- Load demo workspace
- Reset demo workspace

Demo data is required for screenshots and E2E tests.

---

# 34. Testing strategy

## 34.1 Unit tests — Vitest

Required for:

- TimeService logical-day behavior
- timezone conversions
- recurrence materialization
- Quick Add parsing
- Next Up scoring
- planning accuracy formulas
- estimate accuracy buckets
- start delay calculations
- capacity calculations
- weekly story rules
- workflow semantic validation
- task/subtask constraints
- review snapshot versioning
- backup Zod validation/migration

## 34.2 Integration tests

Use a test IndexedDB implementation where practical.

Test domain commands:

- Task reschedule updates Task + activity event atomically
- Session finish closes active segment
- completing Task handles future plan choice
- Review completion creates immutable revision
- import restore transaction safety

## 34.3 Component tests

Testing Library for:

- keyboard navigation
- Inspector edits
- Command Menu
- Process Inbox
- Focus replace behavior
- Daily Close flow
- Weekly Review steps

## 34.4 E2E — Playwright

Critical journeys:

### Journey A — Capture to execution

1. Instant Capture
2. Process Inbox → Task
3. assign Today
4. add Focus
5. drag to Timeline
6. start Session
7. pause/resume
8. finish
9. see Actual block

### Journey B — Plan vs Actual

1. create task
2. plan 09:00–10:00
3. start at simulated 09:18
4. finish
5. verify Plan Ghost / Actual solid
6. verify difference in Inspector

### Journey C — Daily Close

1. seeded unfinished tasks
2. resolve them
3. optional reflection
4. close
5. verify daily review revision

### Journey D — Weekly Review

1. seed week data
2. traverse six steps
3. select next-week Focus
4. edit story
5. complete review
6. verify immutable revision/history

### Journey E — Backup

1. seed data
2. export
3. clear workspace
4. import
5. verify entities and settings restored

## 34.5 Visual regression

Use Playwright screenshots for:

- Today 1440 desktop
- Calendar Week 1600 desktop
- Inbox
- Goals
- Project List
- Analytics
- Weekly Review
- Settings
- Dark theme core screens

Use deterministic seeded data and frozen clock.

---

# 35. Quality gates

Every development phase must pass:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Phases affecting critical workflows must also pass relevant Playwright tests.

Before V1 release:

```bash
npm run e2e
```

No phase is “done” with failing known tests unless explicitly recorded as a blocking issue in `DEVELOPMENT_STATUS.md`.

---

# 36. Development phases

## Phase 0 — Project bootstrap

Deliver:

- Vite + React + TypeScript
- Tilo package/app metadata (`package.json` name, document title, manifests)
- Tailwind
- lint/format/test/build scripts
- Router
- base folder structure
- `AGENTS.md`
- Design token scaffolding
- demo route skeletons

Acceptance:

- app boots
- routes render
- quality gates green

## Phase 1 — Foundation / design system

Deliver:

- theme
- dark/light/system
- Indigo tokens
- density
- motion tokens/settings
- AppShell
- Sidebar + collapse
- Inspector Shell
- Command Menu shell
- Capture Bar shell
- Undo toast
- keyboard shortcut registry
- Radix-based primitives

Acceptance:

- visual baseline resembles reference images
- keyboard focus states work
- Reduced Motion works

## Phase 2 — Database and domain core

Deliver:

- Dexie schema v1
- migration framework
- workspace/settings
- task/project/goal/workflow models
- repositories/commands
- activity event logging
- TimeService
- demo seeder
- backup exporter/import validator

Acceptance:

- persistent reload works
- domain commands tested
- demo workspace reproducible

## Phase 3 — Task / Session primitives

Deliver:

- TaskRow
- Task Inspector
- Task Detail
- custom statuses
- priority
- due/scheduled/estimate
- one-level Subtasks
- Session timer + segments
- Active/Background
- Activity History
- basic templates

Acceptance:

- timer survives route navigation
- pause time excluded from Active duration
- history events written

## Phase 4 — Today

Deliver:

- Weekly Focus
- ranked Focus 1–5
- Replace behavior
- Next Up one-item engine
- Unscheduled
- Split/List/Timeline
- shared Timeline Day engine
- plan/actual blocks
- drag schedule
- Floating Timer
- Context Line
- Today customization

Acceptance:

- end-to-end Today journey passes
- Today matches design reference closely

## Phase 5 — Calendar

Deliver:

- Day/Week/Agenda
- remember view
- 5/7 days
- side planning panel
- Plan/Actual filter
- drag create/move/resize
- Focus Blocks
- recurrence
- overlaps
- Background Track
- Capacity
- Allocation drawer
- block Inspector
- external event placeholder types

Acceptance:

- Plan vs Actual clearly readable
- no modal-heavy scheduling flow
- Calendar reference visual regression baseline accepted

## Phase 6 — Inbox

Deliver:

- Instant Capture
- URL recognition
- Unsorted/Someday/Archived
- Inspector processing
- Process Inbox mode
- keyboard shortcuts
- Convert to Task/Note/Project
- archive/trash
- Someday tasks

Acceptance:

- ordinary capture can be completed in ~3 seconds
- Inbox badge equals Unsorted count

## Phase 7 — Goals / Projects

Deliver:

- Goal Overview/Compact
- Goal tracking modes
- Why/Context
- Primary/Related Goal relation
- Goal Detail
- Project Overview
- Project List/Board
- custom Project workflow
- Milestones
- Custom Fields manager
- pin Project to Sidebar

Acceptance:

- Goal remains direction-level
- Project list remains light, not card-heavy
- Board workflow drag works with keyboard alternative

## Phase 8 — Analytics

Deliver:

- period selector
- completion
- planned/actual time
- planning accuracy components
- time allocation dimensions
- capacity
- rescheduling
- unplanned work
- activity by time
- start delay
- estimate accuracy
- widget customization/reset

Acceptance:

- calculations unit-tested against fixtures
- no double-counting Background time in headline Active metrics

## Phase 9 — Review

Deliver:

- Daily Close
- Review Home
- six-step Weekly Review
- Reflection templates
- Goal focus carry-forward
- Someday resurfacing
- deterministic Data Summary
- editable Weekly Story
- immutable Review Revision
- reopen/revision flow
- history

Acceptance:

- snapshot remains unchanged after source Task edits
- Weekly Review E2E green

## Phase 10 — Settings / backup / polish

Deliver:

- all settings sections
- JSON export/import
- backup reminder
- reset layouts
- trash management
- full dark mode
- responsive basic mobile
- accessibility pass
- performance pass

Acceptance:

- clean new user setup
- restore verified
- all quality gates green

## Phase 11 — Release candidate

Deliver:

- remove debug-only surfaces from production
- preserve optional demo seed behind developer flag
- full Playwright suite
- visual regression review
- README usage guide
- changelog

V1 is complete only when `ACCEPTANCE_CHECKLIST.md` is satisfied.

---

# 37. Performance rules

- Do not render every historical Session on every page.
- Query bounded periods for Calendar/Analytics.
- Virtualize very long Task/Inbox lists when needed.
- Recharts widgets should not rerender from unrelated timer ticks.
- Timer UI tick may be 1 second; persistent DB writes should not happen every second.
- Persist timer boundaries/segments, compute displayed elapsed locally.
- Debounce Markdown note writes.
- Memoize expensive analytics by period/input revision where useful.

---

# 38. Privacy and security

V1:

- no analytics tracking service by default
- no account
- no telemetry unless explicitly introduced later
- no AI API
- no server upload

Import:

- treat JSON as untrusted
- validate with Zod
- never evaluate imported content
- render Markdown safely; no raw HTML by default

Links:

- open external links with safe `rel` behavior

---

# 39. Error handling

User-facing errors should be factual:

```text
Import failed. The backup file is not valid.
```

```text
The session could not be saved. Your timer is still running locally.
```

Avoid vague “Something went wrong” where a precise state is known.

Unexpected errors:

- Error Boundary
- allow copy diagnostic details
- do not silently discard user drafts

---

# 40. Definition of done for every feature

A feature is not done until:

1. core happy path works
2. empty state works
3. loading/initial undefined state works
4. error path is considered
5. keyboard operation is supported where relevant
6. Reduced Motion is respected
7. persistent mutations go through command layer
8. activity event is logged where historical meaning exists
9. tests are added/updated
10. typecheck/lint/tests/build pass
11. `DEVELOPMENT_STATUS.md` is updated

---

# 41. Agent execution protocol

Every AI coding-agent work session must:

1. Read `AGENTS.md`.
2. Read this document.
3. Read `DEVELOPMENT_STATUS.md`.
4. Identify the next incomplete Phase/task rather than inventing a new roadmap.
5. Inspect existing code before changing architecture.
6. Implement the smallest coherent vertical slice.
7. Run relevant tests plus global quality gates when practical.
8. Update `DEVELOPMENT_STATUS.md` with:
   - files created/modified
   - functionality completed
   - TypeScript result
   - ESLint result
   - tests/build result
   - known issues
   - exact next task
9. Do not claim success when commands fail.
10. Do not replace this product architecture with a different framework/pattern without explicit user authorization.

---

# 42. Explicit non-goals for V1

Do not implement unless user changes scope:

- authentication
- cloud sync
- collaboration
- sharing links
- team workspaces
- real Google Calendar connection
- real Outlook Calendar connection
- AI summaries
- AI scheduling
- mobile native app
- Electron/Tauri wrapper
- PWA push notifications
- file attachments UI
- arbitrary recurring Task engine beyond required schedule recurrence
- habit as a separate first-class object
- public templates
- plugins
- custom CSS
- Markdown knowledge base
- Gantt chart
- arbitrary dashboard builder

---

# 43. Future-ready seams

V1 should leave extension points for:

- Account / cloud sync
- Multi-workspace UI
- External calendars
- AI Story provider
- AI recommendation provider
- Project templates
- Attachment UI
- Habit experience
- desktop wrapper
- PWA/offline install

But do not build speculative infrastructure beyond simple interfaces/types required to avoid obvious dead ends.

---

# 44. Final product loop acceptance scenario

A successful V1 should support this complete story without workarounds:

1. User thinks of something and presses Instant Capture.
2. It enters Inbox without configuration burden.
3. Later, Process Inbox converts it to a Task under a Project.
4. The Task is selected as Today Focus #1.
5. The user drags it to 14:00; a planned block appears.
6. At 14:22 the user starts it; an Actual Session begins.
7. The user pauses once and resumes.
8. The user finishes at 15:40.
9. Today/Calendar visibly show Plan vs Actual.
10. Inspector shows start delay and Active duration.
11. The Task can continue with another Session later or be completed.
12. Daily Close resolves unfinished tasks and stores a daily snapshot.
13. Analytics reflects Active time, unplanned time, plan accuracy, capacity and estimate accuracy.
14. Weekly Review shows the same week as facts, accepts Reflection, chooses next-week Focus, and creates an immutable snapshot.
15. User exports the workspace as JSON and can restore it.

If this story is fluid, coherent, and visually consistent with the references, Tilo V1 has achieved its core purpose.
