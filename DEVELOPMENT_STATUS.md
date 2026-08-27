# Tilo — Development Status

> This file is the handoff checkpoint for the next AI agent session.
> Keep it concise, factual, and updated after every development session.

## Current phase

**Phase 22 — Smart Day Auto-Packing, Annual Focus Heatmap, Natural Language Capture HUD & Roadmap Gantt (COMPLETE & VERIFIED)**

## Overall status

- [x] Phase 0 — Project bootstrap
- [x] Phase 1 — Foundation / design system
- [x] Phase 2 — Database and domain core
- [x] Phase 3 — Task / Session primitives
- [x] Phase 4 — Today
- [x] Phase 5 — Calendar
- [x] Phase 6 — Inbox
- [x] Phase 7 — Goals / Projects
- [x] Phase 8 — Analytics
- [x] Phase 9 — Review
- [x] Phase 10 — Settings / backup / polish
- [x] Phase 11 — Full V1 Audit & Release Candidate Validation
- [x] Phase 12 — Inbox Closed-Loop Triage, Real-time Goal Progress & Multi-view Modes
- [x] Phase 13 — Rich Markdown Notes Editor, Metric Target Reactive Progress & 4 Canonical Status Tabs
- [x] Phase 14 — Direct 4-Status Quick Toggles on Goal Cards & Project Page
- [x] Phase 15 — Sidebar Logo & Pinned Section Polish, Goal Label & Dual Count Alignment
- [x] Phase 16 — Universal Dark/Light Sleek Linear-style Scrollbars
- [x] Phase 17 — Project Workflow Integration, Task & Reflection Templates, Reschedule Reasons
- [x] Phase 18 — Global Motion Engine & Interactive Sandbox Playground
- [x] Phase 19 — Planned Block Focus Mode & Activity Type Dropdown Presets
- [x] Phase 20 — Repository Root Documentation Cleanup & Modular Archival
- [x] Phase 21 — Web Audio Zen Focus, Markdown/CSV Multi-Format Reports & Elastic Push Ghost Timeboxes
- [x] Phase 22 — Smart Day Auto-Packing, Annual Focus Heatmap, Natural Language Capture HUD & Roadmap Gantt
- [x] Phase 23 — Dual-Channel Capture Differentiation & Inbox Triage Flow Polish
- [x] Phase 24 — PWA Desktop Standalone App & Smart Clipboard Paste Integration
- [x] Phase 25 — Android Native App & Local Gradle Build Pipeline

---

## 1. Files changed

- `src/pages/CalendarPage.tsx` — **[UPDATED]** Implemented dynamic navigation pill text in calendar header (`今日`, `昨日`, `明日`, `回到今日`, `本周`, `回到本周`, `本月`, `回到本月`) responsive to the currently viewed date, week, and view mode.
- `src/components/calendar/CreatePlannedBlockModal.tsx` — **[UPDATED]** Upgraded date/time input layout and auto-linked tasks and projects.
- `src/components/timeline/InlineCreatePopover.tsx` — **[UPDATED]** Added comprehensive time and duration adjustment controls.
- `src/components/settings/ShortcutsSection.tsx` — **[UPDATED]** Documented global shortcut `B` for timeline instant planning.

## 2. Features completed

1. **Dynamic Calendar Navigation Pill Label (日历导航胶囊文本动态感知与回到当前切换)**:
   - 日历左上角的导航胶囊 `< 今日 >` 现已完全实现动态时间与视图模式感知：
     - **日视图 (Day View)**：当天显示 `今日`；切换到昨天显示 `昨日`；切换到明天显示 `明日`；切换到更远日期高亮显示 `回到今日`，点击直接秒级返回当天；
     - **周视图 (Week View)**：当周显示 `本周`；切换到其他周高亮显示 `回到本周`，点击一键返回当前周；
     - **议程/月视图 (Agenda/Month View)**：当月显示 `本月`；切换到其他月份高亮显示 `回到本月`。

2. **Auto-Link Task & Project from Planning Drawer (排期抽屉一键自动关联任务与项目)**:
   - 排期抽屉中点击「Plan」自动带入任务、归属项目、标题和预估时长。

3. **Date Picker Icon Squeezing Fix (日期输入框日历图标遮挡截断修复)**:
   - 重构为 2 栏布局，日期占据 50% 充足宽度，日历图标完美显示。

4. **Duration & Time Controls Complete Unification (日历顶部新建与时间轴弹窗时长控制完全统一)**:
   - 全面支持预设时长芯片、动态时长徽标、`⚡ 对齐现在` 及年月日时分精确选择器。

3. **Strict Current Time Alignment (全处「从现在开始」严格对齐实际当前时刻)**:
   - 移除了所有近似四舍五入取整逻辑，全部以真实系统毫秒/分钟数为准。

## 3. TypeScript / ESLint / tests / build

- **TypeScript** (`npm run typecheck`): Passed (0 errors)
- **ESLint** (`npm run lint`): Passed (0 errors, 0 warnings)
- **Tests** (`npx vitest run src/test/calendarViews.test.tsx src/test/timelineEngine.test.ts src/test/todayTimeline.test.tsx`): Passed (9/9 tests passing)
- **Production Build** (`npm run build`): Passed (0 errors)

## 4. Known issues

- None.

## 5. Next task

- Ready for user verification.
