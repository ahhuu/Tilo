# Tilo V1 Documentation & v1.0.0 Release

Tilo V1 已经完成开发并通过 Full Audit，Release Recommendation 为：

`READY`

现在进入正式发行前的最后阶段。

本任务分为两个严格按顺序执行的阶段：

**Phase A — 完成 Tilo V1 中英文双语用户文档**

完成并验证用户文档以后，才能进入：

**Phase B — Release Freeze 并正式固化 Tilo v1.0.0**

不得跳过 Phase A。

不得在用户文档尚未完成、未验证之前创建 `v1.0.0` Git Tag。

---

# 0. 开始前必须读取

在进行任何修改前，完整阅读并理解当前仓库中的：

1. `AGENTS.md`
2. `README.md`
3. `docs/MASTER_PLAN.md`
4. `docs/DECISIONS.md`
5. `docs/BRANDING.md`
6. `DEVELOPMENT_STATUS.md`
7. `ACCEPTANCE_CHECKLIST.md`
8. `AUDIT_REPORT.md`（如果存在）
9. `AUDIT_SUMMARY.md`（如果存在）
10. 当前 `package.json`
11. 当前源码
12. 当前数据库 Schema / migrations
13. 当前 keyboard shortcuts 实现
14. 当前 Analytics 公式实现
15. 当前 Settings 配置
16. 当前 UI 页面和组件实现

同时检查：

`docs/design/reference/`

中的设计参考。

---

# 1. 重要原则

当前项目已经通过 Full Audit。

因此本轮：

- 不新增 V1 功能
- 不重新设计产品
- 不大规模重构
- 不更换技术栈
- 不修改已经冻结的核心行为
- 不为了文档方便而修改产品逻辑
- 不根据旧设计文档描述不存在的功能

用户文档的事实来源优先级必须是：

```text
当前真实运行代码
↓
当前测试
↓
当前 UI
↓
ACCEPTANCE_CHECKLIST.md
↓
Full Audit 结果
↓
DEVELOPMENT_STATUS.md
↓
MASTER_PLAN.md
```

如果 `MASTER_PLAN.md` 与当前通过 Full Audit 的真实实现存在差异：

**以当前实现为准。**

同时在必要时修正文档，而不是让代码重新迁就旧方案。

---

# ==================================================
# PHASE A — 中英文双语用户文档
# ==================================================

# 2. 用户文档目标

Tilo V1 不应只有开发文档。

需要建立一套真正面向最终用户的完整文档，使第一次接触 Tilo 的用户：

- 不依赖开发者
- 不需要阅读 MASTER_PLAN
- 不需要理解代码
- 不需要先掌握所有高级功能

就能够理解：

> Tilo 是什么  
> 应该怎样开始  
> 每天怎么用  
> 每周怎么用  
> Plan 与 Actual 有什么区别  
> Task 与 Session 有什么区别  
> Goal / Project / Task 如何配合  
> Calendar 如何规划时间  
> Review 如何复盘  
> 数据存在哪里  
> 如何备份和恢复

全部文档必须同时提供：

**简体中文（zh-CN）**

以及：

**English（en）**

两个完整版本。

不是机翻摘要。

中文和英文两个版本必须表达相同的产品事实、结构、功能和操作流程。

---

# 3. 创建文档结构

创建：

```text
docs/
├─ user/
│  ├─ README.md
│  ├─ zh-CN/
│  │  ├─ QUICK_START.md
│  │  ├─ USER_GUIDE.md
│  │  ├─ CONCEPTS.md
│  │  ├─ KEYBOARD_SHORTCUTS.md
│  │  ├─ DATA_AND_BACKUP.md
│  │  └─ FAQ.md
│  │
│  └─ en/
│     ├─ QUICK_START.md
│     ├─ USER_GUIDE.md
│     ├─ CONCEPTS.md
│     ├─ KEYBOARD_SHORTCUTS.md
│     ├─ DATA_AND_BACKUP.md
│     └─ FAQ.md
```

其中：

`docs/user/README.md`

作为文档语言入口。

内容类似：

```text
# Tilo User Documentation

简体中文
→ zh-CN/QUICK_START.md
→ zh-CN/USER_GUIDE.md

English
→ en/QUICK_START.md
→ en/USER_GUIDE.md
```

必须让中英文文档互相链接。

例如中文版顶部：

```text
English version → ../en/USER_GUIDE.md
```

英文版顶部：

```text
简体中文版 → ../zh-CN/USER_GUIDE.md
```

---

# 4. QUICK_START — 快速上手

创建：

```text
docs/user/zh-CN/QUICK_START.md
docs/user/en/QUICK_START.md
```

目标：

**让第一次使用 Tilo 的用户在 5–10 分钟内完成第一次完整执行循环。**

不要写成产品功能百科。

必须使用真实操作流程。

推荐结构：

## 1. Tilo 是什么

用非常简洁的语言介绍：

Tilo 是一个围绕：

```text
Capture
→ Plan
→ Execute
→ Actual
→ Review
```

构建的个人执行系统。

核心不是简单记录：

> 我要做什么

而是同时记录：

> 我计划什么时候做  
> 我实际上什么时候做  
> 计划和现实之间发生了什么

---

## 2. 第一次使用

带用户完成：

```text
创建 Goal
↓
创建 Project
↓
创建 Task
↓
设置 Estimate
↓
加入 Today
↓
设为 Focus
↓
拖进 Timeline
↓
创建 Planned Block
↓
Start Session
↓
Pause / Resume
↓
Finish
↓
查看 Plan vs Actual
↓
Daily Close
```

必须使用一个完整示例贯穿。

例如：

```text
Goal
Complete Thesis

Project
PPP Research

Task
Run47 Analysis

Estimate
90 min
```

中文与英文示例保持语义一致。

---

## 3. 第一天结束

说明：

`Daily Close`

以及：

```text
Resolve
Reflect
Close
```

---

## 4. 第一周结束

简单介绍：

`Weekly Review`

不要在 Quick Start 中展开所有 Analytics。

---

## 5. 用户下一步可以了解什么

链接：

- User Guide
- Concepts
- Keyboard Shortcuts
- Data & Backup
- FAQ

---

# 5. CONCEPTS — 核心概念

创建：

```text
docs/user/zh-CN/CONCEPTS.md
docs/user/en/CONCEPTS.md
```

这是 Tilo 最重要的用户文档之一。

必须详细解释：

## Core hierarchy

```text
Goal
↓
Project
↓
Task
↓
Subtask
↓
Session
```

其中说明：

### Goal

长期方向或结果。

### Project

推进 Goal 的阶段性工作。

Project 可以：

- 属于一个 Primary Goal
- 关联其他 Related Goals
- 或完全独立

### Task

可以被完成的工作单位。

Task 可以不属于 Project。

### Subtask

Task 内部的一层拆分。

Tilo 只允许：

**一层 Subtask**

不允许无限嵌套。

### Session

一次真实发生的执行记录。

必须重点解释：

## Task ≠ Session

示例：

```text
Task
Write Chapter 3

Sessions
Monday      45m
Tuesday     1h20m
Wednesday   55m
```

---

# 6. 必须解释以下容易混淆的概念

CONCEPTS 中单独建立章节解释：

## Due Date vs Scheduled Date

### Due

最晚什么时候完成。

### Scheduled

准备在哪一天做。

---

## Scheduled Date vs Planned Block

Scheduled：

```text
August 25
```

Planned Block：

```text
August 25
14:00–15:30
```

---

## Plan vs Actual

Plan：

> 我原本准备什么时候做。

Actual：

> 实际什么时候发生。

说明视觉语义：

```text
Ghost / lighter block = Plan
Solid block = Actual
```

必须确认当前 UI 真实实现后再写。

---

## Estimate vs Planned Time vs Actual Time

Estimate：

Task 总预计投入。

Planned：

实际在 Calendar 中分配的计划时间。

Actual：

真实 Session 的 Active Time。

---

## Task vs Focus Block

Task：

要完成的工作。

Focus Block：

给某种类型工作预留的时间预算。

例如：

```text
09:00–11:00
Deep Work
```

Focus Block 不等同于 Task。

---

## Inbox vs Someday

Inbox：

尚未决定如何处理的 Capture。

Someday：

已经确认值得保留，但暂时没有时间承诺的内容。

---

## Active Session vs Background Session

Active：

真正占用注意力。

Background：

后台发生的工作。

必须解释 Background Session 不应错误增加 headline Active Time。

---

## Focus vs Weekly Focus

Today Focus：

今天优先处理的事项。

Weekly Focus：

本周重点推进的 Goal。

---

## Daily Capacity

必须明确：

Daily Capacity **不是系统要求用户必须工作多少小时。**

它表示：

> 用户愿意为当天承诺多少可安排时间。

---

## Snapshot

Weekly Review 完成后保存的历史状态。

必须说明：

后续修改 Task 不应该改变已经冻结的历史 Snapshot。

---

# 7. USER_GUIDE — 完整使用手册

创建：

```text
docs/user/zh-CN/USER_GUIDE.md
docs/user/en/USER_GUIDE.md
```

这是 Tilo V1 的主用户手册。

要求内容完整、细致、可长期维护。

至少包含以下章节。

---

# 7.1 Tilo 是什么

解释产品定位。

不得写营销语言。

避免：

> 革命性的效率工具  
> 极大提升生产力

使用事实描述。

---

# 7.2 Tilo 的工作循环

解释：

```text
Capture
↓
Plan
↓
Execute
↓
Actual
↓
Review
↓
Next Week
```

---

# 7.3 Workspace 与界面结构

介绍实际存在的：

- Sidebar
- Today
- Inbox
- Calendar
- Goals
- Pinned Projects
- Analytics
- Review
- Settings
- Inspector
- Command Menu
- Floating Timer

必须根据当前实际 UI 检查。

---

# 7.4 Today

完整解释：

- Weekly Focus
- Focus 1–N
- Focus 排序
- Focus Replace
- Next Up
- Next Up recommendation reason
- Dismiss
- Unscheduled
- Timeline
- List View
- Timeline View
- Split View
- Context Line
- Floating Timer
- Customize Today
- Reset Layout

说明：

Today 是：

**执行视角**

而不是传统 Dashboard。

---

# 7.5 Calendar

这是重点章节。

详细解释：

- Day
- Week
- Agenda
- 5 / 7 days
- Last View
- Plan
- Actual
- Combined
- Ghost Plan
- Solid Actual
- Drag-create
- Drag move
- Resize
- Snapping
- Focus Blocks
- Recurring schedules
- Overlap indication
- Background Track
- Daily Capacity
- Per-day Capacity override
- Allocation Drawer
- Block Inspector
- Plan vs Actual difference

必须用完整实例解释：

```text
Plan
14:00–15:30

Actual
14:22–15:40
```

以及：

```text
Started 22m later
Actual duration 1h18m
```

说明：

Calendar 是：

**时间管理视角**

而 Today 是：

**执行视角**

同时解释：

二者共享相同的数据和 Timeline 行为。

---

# 7.6 Inbox

解释：

## Capture ≠ Create

以及：

- Instant Capture
- Universal Inbox
- Text
- URL
- Note
- Idea / capture state
- URL detection
- Process Inbox
- continuous processing
- Convert
- Today
- This Week
- Someday
- Archive
- Delete
- Trash
- Restore
- Someday resurfacing
- Empty state

不得把 Inbox 描述为普通 Todo List。

---

# 7.7 Goals

解释：

- Goal 创建
- Tracking mode
- Progress
- Metric Goal
- Manual progress
- No progress
- Ongoing Goal
- Why / Context
- Status
- Color
- Weekly Focus
- Related Projects

---

# 7.8 Projects

解释：

- Standalone Project
- Primary Goal
- Related Goals
- Progress
- Milestones
- Workflow
- Status
- Custom Fields
- List View
- Board View
- Pinned Project
- Project Inspector / detail（如果当前实现存在）

---

# 7.9 Tasks

详细解释：

- Title
- Status
- Priority
- Project
- Tags
- Custom Fields
- Due
- Scheduled
- Estimate
- Planned Blocks
- Progress mode
- Subtasks
- Inspector
- Detail
- Notes
- Activity History
- Reschedule
- Reschedule Reason
- Complete
- Cancel
- Archive / Trash 行为（按真实实现）

---

# 7.10 Sessions

解释：

- Start
- Pause
- Resume
- Finish
- Active Time
- Elapsed Time
- Planned Session
- Actual Session
- Background Session
- Task Session
- Subtask Session
- Manual Session / Activity（如真实实现存在）
- Adjust

说明：

Pause 段不计入 Active Time。

---

# 7.11 Focus

解释：

- 默认数量
- 用户可调整范围
- Rank
- Replace
- Today Focus
- Weekly Focus
- Next Up

不要把 Focus 描述成单独对象，除非真实代码确实如此。

---

# 7.12 Daily Capacity

完整解释：

- Default Capacity
- Weekday / Weekend
- Per-day Override
- Planned vs Capacity
- 为什么 Capacity 不阻止用户超排

示例：

```text
Capacity
8h

Planned
9h20m
```

Tilo 只呈现事实。

---

# 7.13 Daily Close

解释：

```text
Resolve
↓
Reflect
↓
Close
```

说明：

Reflection 可以是 optional。

解释未完成 Task 的实际可选行为。

必须以当前 UI 为准。

---

# 7.14 Analytics

这是另一个重点章节。

逐项解释当前真实存在的：

- Completion Rate
- Planned Time
- Actual Time
- Time Accuracy
- Schedule Accuracy
- Completion Accuracy
- Overall Planning Accuracy
- Rescheduling
- Rescheduling Reasons
- Unplanned Work
- Capacity
- Time Allocation
- Start Delay
- Estimate Accuracy

必须从当前代码核对公式。

不得根据早期设计猜公式。

每个指标至少写：

```text
What it means
How Tilo calculates it
How to interpret it
Example
```

明确：

**Analytics 是事实，不是评分。**

不要暗示用户：

> 分数越高就越优秀。

---

# 7.15 Weekly Review

详细解释六步：

```text
01 Overview
02 Plan vs Actual
03 Goals
04 Patterns
05 Reflection
06 Next Week
```

并解释：

- Data Summary
- Weekly Story
- Story edit
- Reflection Template
- Weekly Metrics
- Weekly Focus carry-over
- Someday resurfacing
- Complete
- Skip
- Snapshot
- Reopen
- Revision

必须解释：

Reopen Review 后历史 revision 的真实行为。

---

# 7.16 Analytics vs Review

明确解释：

Analytics：

> 随时查看数据。

Review：

> 主动完成一次复盘。

---

# 7.17 Customization

解释当前真实实现：

- Today Widgets
- Widget order
- Widget visibility
- Focus count
- Default Today View
- Calendar preferences
- Density
- Accent
- Project colors
- Motion
- Workflow
- Custom Fields
- Reset to Default

不要写不存在的自由 Dashboard Builder。

---

# 7.18 Templates

只写当前 V1 实际实现。

说明：

- 什么可以保存为 Template
- 如何创建
- 如何应用
- 如何删除 / 编辑

不要描述未来 Project Template 等未实现能力。

---

# 7.19 Settings

完整介绍：

- Appearance
- Motion
- Today
- Calendar
- Workflow
- Templates
- Data

以及真实存在的具体选项。

---

# 7.20 Light / Dark / System

解释：

- Light
- Dark
- System
- Accent
- Project Color

---

# 7.21 Motion

解释：

```text
Reduced
Subtle
Balanced
Expressive
```

如果实际名称不同，以当前 UI 为准。

说明默认值。

说明 Reduced Motion 与系统设置的实际关系。

---

# 7.22 Density

解释：

```text
Comfortable
Compact
```

如果实际实现不同，以源码为准。

---

# 7.23 Command Menu

解释：

快捷键。

解释：

- Search
- Create
- Action

三合一用途。

---

# 7.24 Instant Capture

解释与 Command Menu 的区别。

必须明确：

```text
Capture ≠ Create
```

---

# 7.25 推荐的每日使用流程

给出实际推荐流程。

## Morning

3–5 分钟：

```text
查看 Weekly Focus
↓
选择 Today Focus
↓
安排 Timeline
↓
检查 Capacity
```

## During the day

```text
Start Session
↓
Pause / Resume
↓
Finish
```

临时想到的事情：

```text
Instant Capture
→ Inbox
```

## Evening

1–3 分钟：

```text
Daily Close
```

明确告诉用户：

**不需要每天花大量时间维护 Tilo。**

---

# 7.26 推荐的每周流程

例如：

```text
Review current week
↓
Inspect Plan vs Actual
↓
Review Goal progress
↓
Review patterns
↓
Reflection
↓
Select next Weekly Focus
```

---

# 7.27 三种使用深度

必须加入：

## Lightweight

适合只想完成事情：

```text
Today
Tasks
Focus
Daily Close
```

## Standard

推荐默认：

```text
Goal
Project
Today
Calendar
Weekly Review
```

## Deep

高级用户：

```text
Capacity
Plan vs Actual
Analytics
Custom Fields
Templates
Advanced Review
```

让用户知道：

**不需要第一天使用所有功能。**

---

# 8. Keyboard Shortcuts

创建：

```text
docs/user/zh-CN/KEYBOARD_SHORTCUTS.md
docs/user/en/KEYBOARD_SHORTCUTS.md
```

必须通过实际代码搜索核对。

不得直接照早期 MASTER_PLAN。

按类别组织：

- Global
- Navigation
- Command Menu
- Inbox
- Task
- Timeline
- Calendar
- Inspector
- Review

每一个 shortcut 必须确认：

- 当前是否真的实现
- Windows / Linux
- macOS

例如：

```text
Ctrl + K
Cmd + K
```

如果某快捷键只在部分页面可用，要注明 Scope。

---

# 9. Data & Backup

创建：

```text
docs/user/zh-CN/DATA_AND_BACKUP.md
docs/user/en/DATA_AND_BACKUP.md
```

这是 V1 必须非常清楚的一份文档。

说明：

## Local-first

当前 Tilo 数据存在哪里。

## No cloud sync

如果当前 V1 没有 Cloud Sync，必须明确写明。

## Browser data risk

明确说明：

清除浏览器站点数据可能导致本地 Tilo 数据丢失。

不得模糊处理。

## Export

详细说明如何导出。

## Import / Restore

详细说明如何恢复。

## Validation

说明 Restore 会进行数据验证。

## Backup recommendation

给出实际建议。

例如：

> 对重要数据建议定期导出备份。

不要制造恐慌。

## Migration

只写用户真正需要知道的内容。

---

# 10. FAQ

创建：

```text
docs/user/zh-CN/FAQ.md
docs/user/en/FAQ.md
```

至少回答：

1. Task 和 Session 有什么区别？
2. Due 和 Scheduled 有什么区别？
3. Scheduled Date 和 Planned Block 有什么区别？
4. Estimate、Planned Time 和 Actual Time 有什么区别？
5. Plan 和 Actual 为什么同时存在？
6. Focus Block 是 Task 吗？
7. Today 与 Calendar Day 有什么区别？
8. Inbox 与 Someday 有什么区别？
9. Background Session 会不会计入 Active Time？
10. 为什么一个 Task 可以有多个 Session？
11. 为什么 Task 完成后还有历史 Planned Block？
12. Daily Capacity 是工作时间要求吗？
13. 为什么允许 Calendar overlap？
14. Analytics 的 Accuracy 是评分吗？
15. Weekly Snapshot 为什么不会随着 Task 修改而变化？
16. Reopen Review 会发生什么？
17. Tilo 的数据存在哪里？
18. 删除浏览器数据会发生什么？
19. 如何备份？
20. 如何恢复？
21. Tilo 当前是否支持云同步？
22. 是否支持 Google Calendar / Outlook？
23. 是否支持手机？
24. 如何恢复默认布局？
25. 如何关闭或减少动画？

对于未来功能：

必须明确写：

> Not available in Tilo V1.

不要承诺具体未来发布日期。

---

# 11. 中英文一致性要求

中文和英文不是两套独立文档。

必须建立一致的章节结构。

例如：

```text
zh-CN USER_GUIDE Section 7
Calendar

en USER_GUIDE Section 7
Calendar
```

语义对应。

所有：

- 数值
- 示例
- 功能名称
- Shortcut
- Analytics 公式
- Settings 名称

必须一致。

如果 UI 本身当前使用英文名称：

中文版第一次出现时建议：

```text
每日收尾（Daily Close）
```

后续可以直接使用：

`Daily Close`

避免翻译后用户找不到 UI。

---

# 12. Terminology Glossary

在中英文 `CONCEPTS.md` 中加入 terminology table。

例如：

| English | 简体中文 |
| --- | --- |
| Goal | 目标 |
| Project | 项目 |
| Task | 任务 |
| Subtask | 子任务 |
| Session | 执行时段 |
| Plan | 计划 |
| Actual | 实际 |
| Planned Block | 计划时间块 |
| Focus Block | 专注时间块 |
| Daily Capacity | 每日容量 |
| Daily Close | 每日收尾 |
| Weekly Review | 每周复盘 |
| Snapshot | 快照 |

但是：

最终翻译必须结合当前 UI 和项目已有 terminology。

不要擅自创建与 UI 冲突的新翻译。

---

# 13. 文档风格

用户文档必须：

- 清晰
- 克制
- 非营销
- 非开发者口吻
- 多用实际例子
- 解释 Why
- 不只解释按钮
- 避免大段抽象理论
- 避免无意义 Emoji
- 避免鸡汤
- 避免评价用户行为

禁止：

> Great job!

> You are crushing it!

> Stay productive!

> Don't give up!

Tilo 的文档继续遵守产品原则：

**Present facts. Do not judge the user.**

---

# 14. README 更新

更新项目根目录：

`README.md`

增加：

```text
## User Documentation

### 简体中文
- Quick Start
- User Guide
- Concepts
- Keyboard Shortcuts
- Data & Backup
- FAQ

### English
- Quick Start
- User Guide
- Concepts
- Keyboard Shortcuts
- Data & Backup
- FAQ
```

使用正确的相对链接。

README 同时应该明确：

`Tilo V1`

当前状态。

---

# 15. 文档真实性审计

用户文档写完以后，必须执行：

**Documentation Audit**

创建：

```text
docs/user/DOCUMENTATION_AUDIT.md
```

逐项检查：

- 功能是否真实存在
- UI 名称是否准确
- Shortcut 是否真实存在
- Analytics 公式是否准确
- Settings 是否真实存在
- Data / Backup 行为是否准确
- Plan / Actual 行为是否准确
- Review 行为是否准确
- Capacity 行为是否准确
- Timeline 行为是否准确

特别搜索文档中的：

```text
TODO
TBD
coming soon
placeholder
FocusFlow
```

最终正式用户文档中不得残留。

如果发现文档描述了实际不存在的功能：

**修改文档。**

不要为了让文档成立而临时新增产品功能。

---

# 16. 用户文档完成条件

Phase A 只有在以下条件全部成立后才算完成：

- 中文 Quick Start 完整
- 英文 Quick Start 完整
- 中文 User Guide 完整
- 英文 User Guide 完整
- 中文 Concepts 完整
- 英文 Concepts 完整
- 中文 Keyboard Shortcuts 完整
- 英文 Keyboard Shortcuts 完整
- 中文 Data & Backup 完整
- 英文 Data & Backup 完整
- 中文 FAQ 完整
- 英文 FAQ 完整
- 中英文交叉链接正确
- README 链接正确
- Documentation Audit PASS
- 无旧 `FocusFlow` 产品名残留
- 文档与真实 V1 实现一致

完成后更新：

`DEVELOPMENT_STATUS.md`

新增：

```text
Tilo V1 User Documentation
Status: COMPLETE

Chinese: PASS
English: PASS
Documentation Audit: PASS
```

---

# ==================================================
# PHASE B — Tilo v1.0.0 Release Freeze
# ==================================================

只有 Phase A 完成后才能开始本阶段。

---

# 17. Release Freeze

现在将当前功能范围正式冻结为：

# Tilo v1.0.0

从此时开始：

- 不增加新功能
- 不进行非必要重构
- 不改变已经通过 Full Audit 的产品行为
- 不改变已经冻结的 UI
- 不顺手处理 Post-V1 feature

---

# 18. 检查技术债务标记

全仓库搜索：

```text
TODO
FIXME
HACK
XXX
@ts-ignore
@ts-expect-error
eslint-disable
console.log
debugger
```

逐项检查。

原则：

### Release blocker

必须修复。

### 非阻塞 Post-V1 项

记录进：

`POST_V1_BACKLOG.md`

不要因此大规模修改已经稳定代码。

---

# 19. Version

检查：

`package.json`

将正式版本设为：

```text
1.0.0
```

同步检查其他真实需要维护版本号的位置。

不要：

- 随意修改 IndexedDB Schema version
- 为了和 App version 一致修改数据库 migration version

App Version 和 Database Schema Version 是不同概念。

---

# 20. CHANGELOG

创建或更新：

`CHANGELOG.md`

加入：

```text
# Tilo 1.0.0
```

按实际 V1 功能整理：

## Today

## Calendar

## Inbox

## Goals & Projects

## Tasks & Sessions

## Analytics

## Review

## Settings & Customization

## Data & Backup

## Accessibility

## User Documentation

## Architecture

不得记录不存在的功能。

---

# 21. Release Notes

创建：

```text
docs/releases/V1_RELEASE_NOTES.md
```

建议结构：

# Tilo 1.0.0

## What is Tilo?

## Core Workflow

```text
Capture → Plan → Execute → Actual → Review
```

## What's Included

### Today
### Calendar
### Inbox
### Goals & Projects
### Tasks & Sessions
### Analytics
### Review
### Customization
### Local Data
### Backup & Restore
### Accessibility
### Bilingual User Documentation

## Platform

明确：

Desktop Web First

以及当前实际 responsive 支持情况。

## Data Model

说明：

Local-first

## Known Limitations

只写真实存在的已知限制。

## Not Included in V1

例如只有在当前确实未实现时才写：

- Cloud Sync
- Accounts
- Multi-device Sync
- External Calendar integration
- Native Mobile Apps
- AI-generated Review

以当前实际实现为准。

不要根据旧规划机械列举。

---

# 22. POST_V1_BACKLOG

创建或整理：

`POST_V1_BACKLOG.md`

统一记录：

- Post-V1 enhancements
- P3 technical debt
- non-blocking UX improvements
- future integrations
- performance optimizations
- cloud capabilities
- mobile optimization
- optional AI capabilities
- future template extensions

每项建议包含：

```text
Title
Category
Reason
Priority
Dependencies
```

但不要在本轮实现。

---

# 23. README Release Update

让 `README.md` 成为正式项目入口。

至少包含：

# Tilo

## Overview

## Screenshots

如果当前 repo 已经有合适截图资源，则链接现有资源。

不要临时生成伪截图。

## Core Features

## User Documentation

### 中文
### English

## Tech Stack

## Requirements

## Installation

## Development

## Testing

## Build

## Local Data

## Backup & Restore

## Keyboard Shortcuts

## Project Structure

## Release Status

明确：

```text
Current release: Tilo v1.0.0
```

只有最终 Release Validation PASS 后才正式写入。

---

# 24. Production Clean Install

从干净依赖环境进行验证。

使用当前项目锁文件对应的 package manager。

不要擅自换 npm / pnpm / yarn。

完成：

```text
install
typecheck
lint
test
build
e2e
```

如果项目当前命令是：

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
npm run e2e
```

则执行这些命令。

如果 package manager / scripts 不同：

以当前仓库为准。

---

# 25. Production Smoke Test

不能只验证 dev server。

必须验证 production build。

完整测试至少包括：

## Today

- Open Today
- Focus
- Next Up
- Timeline
- Unscheduled
- Timer

## Calendar

- Plan
- Actual
- Combined
- Drag create
- Drag move
- Resize
- Snapping
- Capacity
- Focus Block
- Recurring
- Inspector
- Background

## Inbox

- Capture
- Process
- Convert
- Someday
- Archive
- Trash

## Goal / Project

- Create
- Edit
- Progress
- Milestone
- Workflow
- Related Goal
- Custom Fields

## Task

- Create
- Edit
- Due
- Scheduled
- Planned Block
- Subtask
- Reschedule
- Complete

## Session

- Start
- Pause
- Resume
- Finish

## Analytics

确认主要指标有真实数据并正确显示。

## Review

- Daily Close
- Weekly Review
- Snapshot
- Reopen
- Revision

## Settings

- Light
- Dark
- System
- Density
- Motion
- Today
- Calendar
- Workflow
- Templates
- Data

## Backup

- Export
- Restore

---

# 26. Persistence Test

必须验证：

创建真实测试数据。

Reload。

确认：

- Goal
- Project
- Task
- Subtask
- Session
- Planned Block
- Settings
- Layout
- Review
- Templates

保持正确。

---

# 27. Backup / Restore Final Verification

流程：

```text
Create test workspace data
↓
Export
↓
Clear / empty environment
↓
Restore
↓
Verify
```

确认：

- relationship 完整
- workspaceId 正确
- Session 正确
- Planned Blocks 正确
- Reviews 正确
- Settings 正确
- 不产生 orphan records

---

# 28. Browser Console

在主要流程中确认不存在：

- `console.error`
- React warning
- unhandled promise rejection
- IndexedDB error
- runtime exception

记录结果。

---

# 29. Accessibility Final Pass

再次验证：

- keyboard navigation
- focus-visible
- accessible names
- ARIA
- popover focus management
- dialog focus management
- Inspector keyboard use
- Escape behavior
- Reduced Motion
- contrast
- status not color-only
- tab order

---

# 30. Responsive Final Pass

至少验证：

```text
1920
1440
1280
1024
900
768
390
```

目标：

Desktop 优先。

Mobile 要做到：

**usable**

不要求：

**feature parity with desktop**

但不得：

- 页面崩坏
- 关键按钮不可访问
- Inspector 无法关闭
- 内容严重溢出
- 导航无法使用

---

# 31. Visual Regression

重新验证主要界面。

至少：

- Today
- Calendar
- Inbox
- Goals
- Goal Detail
- Project List
- Project Board
- Analytics
- Daily Close
- Weekly Review
- Review History
- Settings
- Command Menu
- Inspector
- Floating Timer

主要页面同时检查：

Light

Dark

不要因为发现 screenshot diff 就直接覆盖 baseline。

先判断：

Regression

还是：

Intentional Change

---

# 32. Git Hygiene

执行：

```bash
git status
git diff
```

检查：

- 临时文件
- build artifacts
- screenshots
- test output
- local DB
- `.env`
- secret
- token
- local-only config
- debug logs
- OS files
- editor files

不得把 secret 提交到 repo。

---

# 33. 最终 Release Audit

创建：

```text
docs/releases/V1_FINAL_RELEASE_AUDIT.md
```

记录：

## Version

`1.0.0`

## Full Audit

`READY`

## Documentation

Chinese: PASS  
English: PASS  
Documentation Audit: PASS

## Typecheck

PASS / FAIL

## Lint

PASS / FAIL

## Unit Tests

PASS / FAIL

## E2E

PASS / FAIL

## Build

PASS / FAIL

## Production Smoke Test

PASS / FAIL

## Persistence

PASS / FAIL

## Backup / Restore

PASS / FAIL

## Accessibility

PASS / FAIL

## Responsive

PASS / FAIL

## Visual Regression

PASS / FAIL

## Console

PASS / FAIL

## Git Hygiene

PASS / FAIL

## Known Release Issues

列出真实问题。

## Final Recommendation

只能是：

```text
READY FOR v1.0.0
```

或者：

```text
NOT READY
```

---

# 34. 更新 DEVELOPMENT_STATUS

最终更新：

`DEVELOPMENT_STATUS.md`

明确记录：

```text
Tilo V1

Product Development: COMPLETE
Full Audit: READY
User Documentation zh-CN: COMPLETE
User Documentation en: COMPLETE
Documentation Audit: PASS
Release Freeze: COMPLETE
Version: 1.0.0
Final Release Validation: PASS
```

并记录：

- typecheck
- lint
- test
- build
- e2e
- visual regression
- accessibility
- database integrity
- analytics audit
- backup / restore
- production smoke test

结果。

---

# ==================================================
# PHASE C — Git v1.0.0
# ==================================================

只有下面所有条件同时成立，才允许进入：

```text
Full Audit = READY
Documentation Audit = PASS
Release Audit = READY FOR v1.0.0
typecheck = PASS
lint = PASS
test = PASS
build = PASS
e2e = PASS
```

---

# 35. Final Diff Review

在创建 Tag 前：

执行：

```bash
git status
git diff
```

再次确认：

当前所有 release 文件正确。

不得遗漏用户文档。

不得包含临时文件。

---

# 36. Release Commit

如果当前存在尚未 commit 的正式 Release 修改：

创建一个正式 Release commit。

推荐 message：

```text
release: Tilo v1.0.0
```

提交内容可以包括：

- bilingual user documentation
- README
- CHANGELOG
- release notes
- release audit
- version metadata
- release-only cleanup

不要把本地临时文件一起提交。

---

# 37. 创建 Git Tag

只有 Release Commit 成功且工作区状态符合当前项目要求时：

创建：

```bash
git tag -a v1.0.0 -m "Tilo v1.0.0"
```

然后验证：

```bash
git tag --list
git show v1.0.0 --stat
```

确认：

`v1.0.0`

指向正确的 Release Commit。

---

# 38. 不要自动 Push

创建本地：

```text
v1.0.0
```

Tag 即可。

**不要自动执行：**

```bash
git push
git push --tags
git push origin v1.0.0
```

除非我之后明确要求。

---

# 39. 最终汇报

整个任务完成以后，向我输出一份简洁但完整的最终报告。

必须包含：

## Tilo v1.0.0

### Documentation

- 中文 Quick Start
- English Quick Start
- 中文 User Guide
- English User Guide
- 中文 Concepts
- English Concepts
- 中文 Keyboard Shortcuts
- English Keyboard Shortcuts
- 中文 Data & Backup
- English Data & Backup
- 中文 FAQ
- English FAQ
- Documentation Audit

状态。

### Release Files

列出本轮新增 / 修改的：

- README
- CHANGELOG
- Release Notes
- Release Audit
- Post-V1 Backlog
- Development Status
- Version metadata

### Validation

报告：

- typecheck
- lint
- tests
- build
- e2e
- visual regression
- accessibility
- responsive
- database
- persistence
- backup/restore
- production smoke test
- browser console

### Known Issues

如果没有：

明确写：

```text
No known release-blocking issues.
```

不要写“应该没有”。

### Git

报告：

```text
Release commit:
<commit hash>

Tag:
v1.0.0

Tag target:
<commit hash>

Working tree:
clean / not clean
```

### Push

明确说明：

```text
v1.0.0 created locally.
Not pushed to remote.
```

### Final Status

最终只能给出：

# READY — Tilo v1.0.0

或者：

# NOT READY

如果中间任何 Release Gate 失败：

不要强行创建 Tag。

修复真正的 Release Blocker 后重新运行相关验证。

如果问题无法安全解决：

停止创建 Tag，并报告：

`NOT READY`

---

# 40. 工作原则

整个任务期间严格遵守：

**Documentation first. Release second. Tag last.**

不要为了赶进度跳过文档真实性检查。

不要因为之前 Full Audit 是 READY 就跳过 Release Validation。

不要为了让测试通过而：

- 删除测试
- skip 测试
- 降低断言
- 隐藏错误
- 移除有效检查

不要新增 V1 范围外功能。

不要大规模重构稳定模块。

不要自动 Push。

现在开始执行。

先完成 Phase A 的中英文双语用户文档。

Phase A 完整通过后，再继续 Phase B。

Phase B 完整通过后，最后执行 Phase C 并创建本地 `v1.0.0` Tag。

不要只输出计划，直接开始实施。