# Tilo Quick Start Guide

> 简体中文版 → [../zh-CN/QUICK_START.md](../zh-CN/QUICK_START.md)

This guide helps you understand Tilo's core workflow and complete your first full "Plan vs Actual" execution cycle within **5–10 minutes**.

---

## 1. What is Tilo?

Tilo is a personal execution and time management system built around the **"Capture → Plan → Execute → Actual → Review"** loop:

```text
Capture → Plan → Execute → Actual → Review
```

Unlike traditional to-do lists, Tilo does not just record what you intend to do; it simultaneously captures:
- **When you planned to do it** (Planned Block)
- **When you actually spent active focus on it** (Actual Session)
- **The factual variance between planning and reality** (Plan vs Actual Variance)

---

## 2. Your First Complete Workflow

We will walk through an end-to-end example:
- **Long-term Goal**: Complete Master Thesis (`Complete Master Thesis`)
- **Project**: PPP Algorithm Research (`PPP Algorithm Research`)
- **Task**: Run47 Group Analysis (`Run47 Analysis`)
- **Estimate**: 90 minutes (`90 min`)

```text
Create Goal
   ↓
Create Project (Link to Goal)
   ↓
Create Task (Set 90m Estimate)
   ↓
Schedule for Today
   ↓
Set as Focus #1
   ↓
Drag to Timeline to create Planned Block
   ↓
Click Start Session to begin focus timer
   ↓
Pause / Resume during execution
   ↓
Finish Session & complete task
   ↓
Inspect Plan vs Actual (Ghost vs Solid blocks)
   ↓
Perform Daily Close
```

### Step 1: Create Goal & Project
1. Navigate to **Goals** in the left sidebar, click **New Goal** in the top right, enter `Complete Master Thesis`, and select Indigo accent.
2. Go to **Projects**, click **New Project**, enter `PPP Algorithm Research`, and select `Complete Master Thesis` as the Primary Goal.

### Step 2: Create Task and Set Estimate
1. Inside the project or via global shortcut `Ctrl+K` (`Cmd+K` on macOS), open the Command Menu and create the task `Run47 Analysis`.
2. Click the task to open the right-side **Inspector**:
   - Estimate: set to `90` minutes.
   - Scheduled Date: set to `Today`.

### Step 3: Set Focus and Schedule in Today View
1. Click the sidebar to open the **Today** page.
2. In the left task list, click the focus icon on `Run47 Analysis` to set it as **Focus #1**.
3. Drag the task from the unscheduled list directly onto the **Timeline** at 14:00. Tilo will automatically create an adjustable 14:00–15:30 **Planned Block**.

### Step 4: Start Session & Track Execution
1. Click **Start Session** on the timeline block or the focus card.
2. The **Floating Timer** will pop up at the bottom right, counting active focus time.
3. If interrupted, click **Pause** (paused intervals are excluded from active focus duration); click **Resume** when ready.
4. When finished, click **Finish** to record the session and automatically transition the task to `Done`.

### Step 5: Inspect Plan vs Actual Variance
1. Observe the Today timeline:
   - **Ghost dashed block**: Represents the original 14:00–15:30 plan (90m).
   - **Solid block**: Represents the actual executed session (e.g. 14:15–15:45).
2. Click the time block to inspect the factual variance in the **Block Inspector**: e.g., "Started 15 min later, active focus 82 min (excluding 8 min paused)".

---

## 3. End of Day: Daily Close

At the end of your day (taking ~1–2 minutes):
1. In the Today page, click **Daily Close** in the top-right header, or go to **Review** from the sidebar.
2. **Resolve**: Handle unfinished tasks by postponing them to tomorrow, moving to inbox, or cancelling.
3. **Reflect**: Optionally record notes or factual reflections.
4. **Close**: Seal today's immutable execution snapshot.

---

## 4. End of Week: Weekly Review

At the end of the week, open **Weekly Review** from the Review Hub:
- **01 Overview**: Factual summary of planned vs actual focus hours and task completion.
- **02 Plan vs Actual**: Variance inspection and schedule accuracy.
- **03 Goals**: Progress on active primary and related goals.
- **04 Patterns**: Distribution of unplanned work and reschedule reasons.
- **05 Reflection**: Review and edit the rule-generated weekly narrative.
- **06 Next Week**: Select next week's focus goals and seal the revision.

---

## 5. Next Steps

- [Core Concepts](./CONCEPTS.md) — Deep dive into Domain hierarchy, Plan vs Actual, and Task vs Session
- [User Guide](./USER_GUIDE.md) — Comprehensive guide to Inbox Continuous Mode, Calendar, and Analytics formulas
- [Keyboard Shortcuts](./KEYBOARD_SHORTCUTS.md) — Fast keyboard navigation cheat sheet
- [Data & Backup](./DATA_AND_BACKUP.md) — Local-first persistence and JSON backup/restore guide
- [FAQ](./FAQ.md) — Frequently asked questions and edge cases
