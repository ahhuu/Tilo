# Tilo 完整用户手册 (User Guide)

> English version → [../en/USER_GUIDE.md](../en/USER_GUIDE.md)

---

## 目录

1. [Tilo 是什么与产品定位](#1-tilo-是什么与产品定位)
2. [Tilo 的完整执行循环](#2-tilo-的完整执行循环)
3. [工作区与界面结构](#3-工作区与界面结构)
4. [今日视图 (Today)](#4-今日视图-today)
5. [日历视图 (Calendar)](#5-日历视图-calendar)
6. [收件箱与即时捕获 (Inbox & Capture)](#6-收件箱与即时捕获-inbox--capture)
7. [目标管理 (Goals)](#7-目标管理-goals)
8. [项目管理 (Projects)](#8-项目管理-projects)
9. [任务管理 (Tasks)](#9-任务管理-tasks)
10. [专注会话与计时器 (Sessions & Timer)](#10-专注会话与计时器-sessions--timer)
11. [每日容量管理 (Daily Capacity)](#11-每日容量管理-daily-capacity)
12. [每日收尾 (Daily Close)](#12-每日收尾-daily-close)
13. [统计与数据分析 (Analytics)](#13-统计与数据分析-analytics)
14. [每周复盘向导 (Weekly Review)](#14-每周复盘向导-weekly-review)
15. [个性化布局与设置 (Settings & Customization)](#15-个性化布局与设置-settings--customization)
16. [模板系统 (Templates)](#16-模板系统-templates)
17. [命令菜单与即时捕获 (Command Menu & Capture)](#17-命令菜单与即时捕获-command-menu--capture)
18. [推荐日常工作流](#18-推荐日常工作流)
19. [三种使用深度建议](#19-三种使用深度建议)

---

## 1. Tilo 是什么与产品定位

Tilo 是一个专为个人设计的**本地优先（Local-first）**深度执行与时间管理系统。

### 核心定位原则
- **事实呈现而非说教评价**：Tilo 不使用“太棒了！”、“再接再厉！”等鸡汤文案，也不设置连续打卡（Streak）惩罚机制，只客观呈现时间与任务的实际数据。
- **计划与实绩并存**：系统同时记录“原本计划什么时候做”与“实际何时发生”，帮助用户校准时间知觉。
- **纯本地数据隐私**：V1 版本无需注册账号，无需联网后端，所有数据安全驻留在浏览器的 IndexedDB 中。

---

## 2. Tilo 的完整执行循环

Tilo 围绕六个阶段构建完整的生产力闭环：

```text
1. 捕获 (Capture)   ── 灵感与待办快速落入收件箱
2. 规划 (Plan)      ── 在 Today 和 Calendar 中为任务分配时间块
3. 执行 (Execute)   ── 启动会话计时器，专注当下单一任务
4. 实绩 (Actual)    ── 记录实际起止时间与有效时长（剔除暂停）
5. 复盘 (Review)    ── 每日收尾与每周六步复盘，封存不可变快照
6. 展望 (Next Week) ── 承接战略目标至下一周规划
```

---

## 3. 工作区与界面结构

```text
┌──────────────────────────────────────────────────────────┐
│ Header: 面包屑 / 当前视图 / 每日收尾 / 语言 / 帮助       │
├─────────┬────────────────────────────────────────────────┤
│ Sidebar │ Main Content Area                              │
│         │ (Today / Calendar / Inbox / Goals / Projects / │
│ 导航与  │  Analytics / Review / Settings)                │
│ 未整理  ├────────────────────────────────────────────────┤
│ 徽标    │ Inspector (右侧抽屉检视器: Task / Block / Session)│
├─────────┴────────────────────────────────────────────────┤
│ Floating Timer (右下角常驻专注计时控制器)                │
└──────────────────────────────────────────────────────────┘
```

- **侧边栏 (Sidebar)**：快捷键 `[` 可一键折叠或展开，记住上次状态。
- **检视器 (Inspector Shell)**：点击任何任务或时间块可在右侧滑出统一检视面板，按 `Esc` 键快速关闭。
- **浮动计时器 (Floating Timer)**：在开始专注后常驻右下角，支持暂停、恢复与一键完成。

---

## 4. 今日视图 (Today)

Today 是日常**执行的核心操作台**，包含三大视图布局：**分栏视图 (Split)**、**列表视图 (List)** 与 **时间轴视图 (Timeline)**。

### 4.1 本周焦点 (Weekly Focus)
- 页面顶部展示本周选定的核心 Goal 徽章与当前进度条，时刻保持战略方向清晰。

### 4.2 今日聚焦 (Focus 1–N)
- 支持设置 1–3 个核心专注任务（Rank #1, #2, #3）。
- 当聚焦任务已满时，新增聚焦会弹出 **替换流程 (Focus Replace Flow)**，由用户自主决定替换哪一项。

### 4.3 下一步建议 (Next Up)
- 算法基于截止日期、排期时间与优先级，在右上方只推荐 **1 项最值得执行的任务**。
- 提供客观的事实理由（例如：“已排期于 14:00 开始” 或 “高优先级今日未安排”），支持一键“采纳执行”或“忽略 (Dismiss)”。

### 4.4 待安排列表 (Unscheduled) 与时间轴拖拽
- 待安排任务可以直接**拖拽 (Drag & Drop)** 进入右侧时间轴创建计划块。
- 未填写预估时长的任务，拖入时间轴时默认创建 **30 分钟可拉伸块**。

### 4.5 上下文状态行 (Context Line)
- 顶部客观展示如：“今日已安排 5 项，完成 2 项，累计有效专注 2h 15m”。

### 4.6 布局自定义与重置
- 点击右上角 **自定义布局** 可调整各模块的显示/隐藏与上下顺序；提供 **重置为默认 (Reset to Default)** 按钮。

---

## 5. 日历视图 (Calendar)

Calendar 是**时间维度的宏观规划与审查中枢**。

### 5.1 视图与范围切换
- **日视图 (Day)**、**周视图 (Week)**、**议程视图 (Agenda)**。
- 周视图支持 **工作日 5 天 / 全周 7 天** 切换；系统自动记住上次退出时的视图模式。

### 5.2 过滤器 (Filter)
- **全部 (All / Combined)**：同时显示半透明虚线计划块 (Ghost Plan) 与实色执行块 (Solid Actual)。
- **仅计划 (Plan)**：专注规划时间表。
- **仅实绩 (Actual)**：客观审视时间去向。

### 5.3 时间轴直接拖拽与吸附
- 在时间轴空白处按下并拖拽即可快速创建时间块。
- 移动与拉伸边缘支持 **15 分钟栅格吸附 (15m Snapping)**。
- 多个事件重叠 (Overlap) 时，系统以微弱多列排版平铺展示，不强制遮挡。

### 5.4 侧边规划抽屉与分配抽屉
- **规划抽屉 (Side Planning Drawer)**：左侧展开待安排任务池，方便直接向日历拖拽排期。
- **时间分配抽屉 (Allocation Drawer)**：右侧展示按项目、主目标聚合的计划与实绩耗时占比。

### 5.5 每日容量与单日覆盖 (Capacity & Override)
- 工作日默认容量 8 小时，周末 4 小时。
- 支持点击单日容量标签进行 **单日覆盖 (Per-day Override)**（例如设某天为 6 小时）。

---

## 6. 收件箱与即时捕获 (Inbox & Capture)

### 6.1 即时捕获 (Instant Capture)
- 全局按下快捷键 `C` 呼出轻量捕获框，输入内容按 `Enter` 快速沉淀至收件箱。
- 自动识别并提取粘贴的 URL 链接。

### 6.2 连续整理模式 (Process Inbox Continuous Mode)
- 在 Inbox 页面点击 **连续整理 (P)** 或按键盘 `P` 键，进入全屏单项聚焦整理流。
- **单键极速分流矩阵**：
  - `1`：安排至 **今天 (Today)** 并转为任务
  - `2`：安排至 **本周 (This Week)** 并转为任务
  - `3`：移入 **择日 (Someday)**
  - `T`：打开转任务高级弹窗
  - `N`：转为独立笔记 (Note)
  - `I`：标记为想法 (Idea)
  - `A`：直接归档 (Archive)
  - `X`：删除至废纸篓 (Delete)
  - `J` / `K`：上一个 / 下一个项目
  - `Esc`：退出整理模式

### 6.3 择日回流 (Someday Resurfacing)
- 放入 Someday 的内容不会被遗忘，将在每周复盘 (Weekly Review) Step 2 中自动浮现，供用户重新激活或归档。

---

## 7. 目标管理 (Goals)

- **跟踪模式 (Tracking Mode)**：
  1. **任务完成度 (Task Completion)**：自动汇总关联项目中所有任务的完成比例。
  2. **量化指标 (Metric Goal)**：设置目标数值（如“阅读 20 篇论文”），录入当前进展。
  3. **持续进行 (Ongoing)**：无固定终点的持续维护类目标。
- **战略聚焦**：支持将 Goal 设为 **本周焦点 (Weekly Focus)**。

---

## 8. 项目管理 (Projects)

- **主目标与关联目标**：每个项目可绑定 1 个主目标 (`Primary Goal`) 与若干关联目标 (`Related Goals`)，支持进度贡献。
- **里程碑 (Milestones)**：为项目添加阶段性里程碑与截止日期。
- **视图模式**：支持 **列表视图 (List)** 与 **看板视图 (Board)** 自由切换。
- **项目置顶**：常用项目可点击置顶，固定展示在侧边栏。

---

## 9. 任务管理 (Tasks)

- **属性完整性**：标题、描述 (Markdown)、优先级（紧急/高/中/低/无）、预估耗时、截止日期、安排日期、标签。
- **严格单层子任务 (One-level Subtasks)**：父任务下可添加子任务，子任务禁止继续嵌套。子任务可独立安排日期和启动计时。
- **改期审计流 (Reschedule Audit)**：修改任务安排日期时可选择填写改期原因，系统自动向 `activityEvents` 写入客观记录，供复盘与统计分析。

---

## 10. 专注会话与计时器 (Sessions & Timer)

- **计时控制**：开始、暂停、恢复、完成。
- **时长统计准则**：
  $$\text{有效专注时长 (Active Time)} = \text{总流逝时长 (Elapsed Time)} - \text{暂停时长 (Paused Time)}$$
- **后台会话 (Background Session)**：非直接交互的长时运行任务（如跑模型）可标记为后台会话，不污染前台核心专注时长。

---

## 11. 每日容量管理 (Daily Capacity)

- **设计定位**：时间预算边界参考，而非强制配额。
- **图表提示**：当单日规划的时间块总和超过容量时，日历与 Analytics 会以微弱标记提示超额（Over-capacity），辅助合理规划。

---

## 12. 每日收尾 (Daily Close)

在一天工作结束时执行结构化三步收尾：
1. **解决遗留 (Resolve)**：批量处理今日未完成的任务（移至明天/下周/择日/取消）。
2. **记录反思 (Reflect)**：选填当日总结与反思笔记。
3. **确认封存 (Close)**：生成不可变快照，清空今日执行态。

---

## 13. 统计与数据分析 (Analytics)

Analytics 提供 12 大客观指标，严格遵循 Master Plan 数值定义：

| 指标名称 | 计算公式与逻辑 | 业务含义与解读 |
| :--- | :--- | :--- |
| **完成率 (Completion Rate)** | $\frac{\text{周期内排期并完成的任务数}}{\text{周期内排期的有效任务总数}}$ | 衡量排期任务的实际交付比例（排除子任务膨胀）。 |
| **时间准确度 (Time Accuracy)** | 计划/实际配对：$1 - \frac{\|Actual - Planned\|}{\max(Actual, Planned)}$，按计划时长加权平均 | 衡量专注时长与计划时长的一致程度。 |
| **排期准确度 (Schedule Accuracy)**| $\frac{\text{在计划开始时间 } \pm 15 \text{ 分钟内启动的会话数}}{\text{关联计划块的会话总数}}$ | 衡量按时启动执行的守时率。 |
| **完成准确度 (Completion Accuracy)**| 同排期任务完成率 | 衡量交付兑现度。 |
| **综合计划准确度 (Overall Accuracy)**| $\frac{\text{Time Acc} + \text{Schedule Acc} + \text{Completion Acc}}{3}$ | 计划能力的综合参考均值。 |
| **临时插入工作 (Unplanned Work)**| 周期内无对应 Planned Block 的 Active Session 时长及占比 | 衡量突发事件或无排期工作对专注的占用。 |
| **延迟启动分析 (Start Delay)** | 关联会话与计划开始时间的差值分布（准时 / <15m / 15-30m / >30m） | 诊断拖延与启动阻力分布。 |
| **预估准确度 (Estimate Accuracy)**| 误差比率 $\frac{Actual - Estimate}{Estimate}$，分为精准 ($\pm 15\%$)、低估 (>15%)、高估 (<-15%) | 辅助校准任务耗时预估直觉。 |
| **容量分析 (Capacity Analysis)** | 每日计划与实际耗时对比容量上限，统计超额天数 | 评估超负荷规划倾向。 |
| **多维时间分配 (Time Allocation)** | 按项目 (Project)、主目标 (Goal)、优先级 (Priority)、标签 (Tag) 分布 | 查看时间精力在各维度的真实投入分布。 |
| **改期原因统计 (Rescheduling)** | 汇总改期 ActivityEvents 中的客观原因与最高频改期任务 | 找出导致计划推迟的系统性阻塞因素。 |

> 所有统计图表支持自定义显隐与重置为默认布局。

---

## 14. 每周复盘向导 (Weekly Review)

每周复盘包含六个结构化步骤：
1. **01 概览 (Overview)**：计划与实际总时长、任务完成数、目标推进摘要。
2. **02 计划与实绩 (Plan vs Actual)**：审视时间轴偏差、时间准确度与择日待办 (Someday) 回流整理。
3. **03 目标推进 (Goals)**：查看本周战略目标的推进情况。
4. **04 执行模式 (Patterns)**：分析临时插入工作、延迟分布与改期原因。
5. **05 周度反思 (Reflection)**：审阅基于规则自动生成的 **周度叙事 (Weekly Story)**，支持在封存前自由编辑。
6. **06 下周展望 (Next Week)**：选定下周聚焦目标与量化指标，确认完成并生成不可变快照。

- **重新开启 (Reopen)**：如需补充，重新开启将生成新版次 (`revision + 1`)，旧版历史快照严格保留不变。
- **跳过复盘 (Skip)**：允许标记跳过特定周期的复盘，不伪造历史数据。

---

## 15. 个性化布局与设置 (Settings & Customization)

- **外观 (Appearance)**：浅色 (Light) / 深色 (Dark) / 跟随系统 (System)；界面语言（中文 / English）；紧凑度（舒适 Comfortable / 紧凑 Compact）。
- **动效 (Motion)**：减弱 (Reduced) / 微弱 (Subtle) / 平衡 (Balanced) / 丰富 (Expressive)。完整响应操作系统的 `prefers-reduced-motion` 设置。
- **工作流 (Workflow)**：自定义任务与项目的工作流状态名称、颜色及语义映射（Open / Active / Waiting / Completed / Cancelled）。
- **数据管理 (Data)**：导出全量 JSON 备份、校验并恢复备份、重置演示数据。

---

## 16. 模板系统 (Templates)

- **任务模板 (Task Templates)**：快速应用预设的检查清单、预估耗时与子任务结构。
- **反思模板 (Reflection Templates)**：自定义 Daily Close 与 Weekly Review 的反思提问问卷。

---

## 17. 命令菜单与即时捕获 (Command Menu & Capture)

- **`Ctrl+K` / `Cmd+K` (命令菜单)**：全局搜索任务、快速跳转路由、触发常用操作。
- **`C` (即时捕获)**：极速呼出待办记录框，实现“捕获不中断当前工作”。

---

## 18. 推荐日常工作流

### 早晨 (3–5 分钟)
1. 打开 Today 视图，查看顶部 Weekly Focus。
2. 选择 1–3 项核心任务设为 Focus。
3. 将待安排任务拖入 Timeline，结合 Daily Capacity 确认无过度超排。

### 日间执行
1. 点击 Focus 任务上的 Start Session 开启计时。
2. 临时突发事件与灵感按 `C` 键捕获至收件箱，不打断当下专注。
3. 会话结束点击 Finish 结算。

### 晚间收尾 (1–2 分钟)
1. 点击右上角 Daily Close。
2. 整理遗留未完成任务，选填一句话反思，封存快照。

---

## 19. 三种使用深度建议

- **轻量级 (Lightweight)**：仅使用 Today 任务列表、Focus #1 和 Daily Close 记录日常待办。
- **标准级 (Standard - 推荐)**：使用 Goals → Projects → Tasks 层级，配合 Calendar 拖拽时间块与 Weekly Review 每周复盘。
- **深度级 (Deep)**：启用 Daily Capacity 预算、Plan vs Actual 偏差分析、自定义工作流状态与 Analytics 统计图表。
