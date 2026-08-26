# Tilo Core Concepts & Domain Model (Concepts)

> 简体中文版 → [../zh-CN/CONCEPTS.md](../zh-CN/CONCEPTS.md)

Tilo is grounded in a rigorous, disciplined domain model tailored for realistic personal execution. Understanding these concepts will help you build your own time and execution closed-loop system.

---

## 1. Core Execution Hierarchy

Tilo enforces a strict 5-tier domain hierarchy:

```text
Goal
  ↓
Project
  ↓
Task
  ↓
Subtask (Strictly 1-level deep)
  ↓
Session
```

### 1.1 Goal
- **Definition**: A long-term strategic outcome, milestone destination, or sustained area of focus.
- **Characteristics**: Supports automatic progress aggregation from task completions, custom metric tracking, or ongoing maintenance mode.

### 1.2 Project
- **Definition**: A structured container of work aimed at achieving a specific milestone.
- **Characteristics**:
  - Can belong to 1 Primary Goal (`Primary Goal`);
  - Can link to multiple auxiliary goals (`Related Goals`);
  - Can exist as a standalone project without any goal association.

### 1.3 Task
- **Definition**: A concrete unit of work with a well-defined completion criterion.
- **Characteristics**: Can belong to a project or exist standalone. Contains estimate minutes, due date, scheduled date, and workflow status.

### 1.4 Subtask
- **Definition**: A single-level breakdown inside a parent task.
- **Strict Rule**: Tilo strictly enforces **exactly one level of subtasks** (no arbitrary nesting). Subtasks can be scheduled and timed independently.

### 1.5 Session
- **Definition**: An actual recorded slice of focused execution.

---

## 2. Critical Distinctions

### 2.1 Task ≠ Session
A task represents an **intended output**, whereas a Session records **actual time spent**. Completing a single task often takes multiple sessions across days:

```text
Task: Complete Thesis Chapter 3 Analysis
  ├─ Session 1 (Mon 09:30–10:15): 45 min
  ├─ Session 2 (Tue 14:00–15:20): 1 hr 20 min
  └─ Session 3 (Wed 16:00–16:55): 55 min (Task finished)
```

### 2.2 Due Date vs Scheduled Date
- **Due Date**: The deadline by which the task must be completed.
- **Scheduled Date**: The specific calendar day you plan to work on it.

> **Example**: A report is due August 30 (`Due Date`), but you schedule it to be tackled on August 22 (`Scheduled Date`).

### 2.3 Scheduled Date vs Planned Block
- **Scheduled Date**: Coarse-grained day-level commitment ("I will do this on Friday").
- **Planned Block**: Fine-grained timeline reservation ("I reserve 14:00–15:30 on Friday on the timeline").

### 2.4 Plan vs Actual
- **Plan**: Ex-ante expected schedule, rendered as a **ghost dashed block** on timeline and calendar.
- **Actual**: Ex-post recorded session, rendered as a **solid block**.
- Keeping both visible allows Tilo to display objective variance rather than erasing planning history once executed.

### 2.5 Estimate vs Planned Time vs Actual Time
- **Estimate**: Overall expected effort for the entire task (e.g. 90 minutes).
- **Planned Time**: Duration reserved on the timeline for a block (e.g. 14:00–15:30 = 90 min).
- **Actual Time**: Sum of active focus durations across all sessions linked to the task (excluding pause intervals).

### 2.6 Task vs Focus Block
- **Task**: A specific to-do item.
- **Focus Block**: A **time budget** reserved on the calendar for a certain category of work (e.g. 09:00–11:00 reserved for "Deep Work"). A Focus Block is not a task itself, but tasks can be executed inside it.

### 2.7 Inbox vs Someday
- **Inbox**: Unsorted captures (ideas, links, fleeting notes) awaiting triage.
- **Someday**: Curated backlog items confirmed as valuable, but without an active time commitment for the current week.

### 2.8 Active Session vs Background Session
- **Active Session**: Foreground work requiring full cognitive attention. Paused intervals are excluded from headline active time.
- **Background Session**: Background tasks (e.g. running builds or batch simulations). Tracked separately in analytics without inflating core active focus time.

### 2.9 Today Focus vs Weekly Focus
- **Today Focus**: The top 1–3 prioritized tasks for the day (Rank #1, #2, #3).
- **Weekly Focus**: Strategic focus goal badges selected for the active week.

### 2.10 Daily Capacity
- **Definition**: The budgeted time limit for scheduled focus on a given day (defaults to 8h weekday, 4h weekend).
- **Design Philosophy**: Daily Capacity serves as an objective **budgeting boundary**, not an enforcement barrier. Tilo flags over-capacity days without blocking user flexibility.

### 2.11 Snapshot & Immutability
- **Definition**: The sealed state generated upon completing Daily Close or Weekly Review.
- **Immutability Principle**: Sealed snapshots are strictly read-only. Editing or deleting past tasks will not mutate historical review snapshots.

---

## 3. Terminology Glossary

| English Term | 简体中文 (zh-CN) | Description / Semantic Definition |
| :--- | :--- | :--- |
| **Goal** | 目标 | Long-term direction or key metric outcome |
| **Project** | 项目 | Structured milestone container, linked to primary and related goals |
| **Task** | 任务 | Actionable unit of work with completion state |
| **Subtask** | 子任务 | Strictly one-level deep breakdown inside a task |
| **Session** | 执行时段 / 会话 | Recorded slice of active focus execution |
| **Planned Block** | 计划时间块 | Scheduled time reservation on timeline (ghost block) |
| **Focus Block** | 专注时间块 | Pre-allocated calendar time budget for specific work categories |
| **Plan vs Actual** | 计划与实绩 | Analytical system comparing planned schedules against execution |
| **Daily Focus** | 今日聚焦 | Top daily priority tasks (ranked 1–N) |
| **Weekly Focus** | 本周焦点 | Strategic goals selected as weekly priorities |
| **Next Up** | 下一步建议 | Objective single next-action recommendation with factual reason |
| **Daily Capacity** | 每日容量 | Daily available focus budget (weekday/weekend customizable) |
| **Daily Close** | 每日收尾 | End-of-day task resolution and snapshot sealing |
| **Weekly Review** | 每周复盘 | Structured 6-step weekly reflection and planning workflow |
| **Review Revision** | 复盘修订版次 | Immutable snapshot revision counter (e.g. revision 1, 2) |
| **Instant Capture** | 即时捕获 | Low-friction global modal for fleeting thoughts and links |
| **Inspector** | 检视器 | Reusable right-side panel for inspecting and editing entities |
| **Command Menu** | 命令菜单 | Global `Ctrl+K` command and navigation launcher |
| **Unplanned Work** | 临时插入工作 | Active focus sessions executed without an ex-ante planned block |
