# Tilo 产品与用户体验审计（2026-10-21）

> 审计对象：Tilo v1.3.0（本地优先个人执行系统）
> 审计视角：① 用户体验（IA / 旅程 / 一致性 / 可访问性 / 性能 / 首启）② 与同类产品的差异与定位
> 方法：代码库扫描（约 170 源文件 / 32.5k 行）+ 规划文档比对（MASTER_PLAN / BRANDING / POST_V1_BACKLOG）+ 竞品公开资料核对（价格与能力核验于 2026-06~09）

---

## 0. 结论先行

1. **Tilo 有一块真正稀缺的地**：「计划 vs 实际」是一等公民数据 + 计划准确度量化 + 不可变复盘修订。市面上没有第二家把它做成主叙事（Sunsama 有"时间都去哪了"，Motion/Reclaim 的 analytics 主要服务于会议与自动排程）。
2. **但这块地没有被讲出来**。首屏是常规的任务/时间轴，最能体现差异的 Analytics 页**没有空态、没有解读、没有入口引导**——新用户在前 10 分钟完全感知不到 Tilo 和其他待办应用的区别。这是当前最高杠杆的问题。
3. **本地优先 + 买断式（无订阅、无登录）是结构性优势**，且 2026 年赛道正在验证它：Clockwise 于 2026-03 被 Salesforce 收购后彻底关停、用户数据被删除；Reclaim 被 Dropbox 收购。Tilo 的"数据永远在本地、可 JSON 导出"应该从"技术选择"升级为"对外承诺"。
4. **一致性债务已到临界点**：28 个手写弹窗壳、3 套并行的通知/反馈机制、z-index 四种取值、约 30 个可点但不可聚焦的 div。继续叠加功能会让每次改动的边际成本越来越高。
5. **移动端已止血，但定位需要被"产品化"**：目前移动端是"能用"，还不是"顺手"。建议把「手机=捕获与执行，电脑=规划与复盘」写进产品文案与首次引导，而不是让用户自己猜。

---

## 1. 定位与市场对照

### 1.1 赛道上的四类玩家

| 类型 | 代表 | 核心主张 |
|---|---|---|
| AI 自动排程 | Motion、Reclaim | 把任务自动塞进日历，会议/专注时间自动防御 |
| 引导式每日仪式 | Sunsama、Open Sunsama | 每天早晨手动规划、晚上 shutdown，强调"掌控感" |
| 可视化时间轴 | Structured、TimeBloc | 手机端一条时间轴，轻量、好看 |
| 任务聚合 + 日历 | Akiflow、Morgen | 把多来源任务拉到一个清单再排期 |
| **计划/实际度量 + 复盘** | **Tilo** | 回答"我打算做什么 / 实际做了什么 / 差异是什么" |

### 1.2 逐项对照

| 维度 | Tilo | Sunsama | Motion | Reclaim | Structured | Akiflow / Morgen |
|---|---|---|---|---|---|---|
| 价格 | 自托管/本地，**无订阅** | $17–22/月 | $19/座/月（AI 额度另计） | 免费档 + $10/座起 | 免费 + Pro ≈$30/年 | $19–34/月 |
| 登录/云 | **无登录、无云** | 需账号 | 需账号 | 需账号 | 需账号 | 需账号 |
| 离线可用 | **是** | 核心功能需联网 | 需联网 | 需联网 | 部分 | 需联网 |
| 日历集成 | 无（F-002 在 backlog） | 双向同步 | 双向 | 仅 Google/Outlook | 系统日历 | 多日历聚合 |
| 自动排程 | 无（"建议而不假设"） | 无（仪式式） | **强** | **中** | 无 | 部分 |
| 计划 vs 实际 | **一等公民数据** | 有回顾 | 弱 | 弱 | 无 | 无 |
| 计划准确度指标 | **6+ 项复合指标** | 时间使用统计 | 会议分析 | 会议分析 | 无 | 无 |
| 结构化周复盘 | **6 步 + 不可变修订** | 周目标 + shutdown | 无 | 无 | 无 | 无 |
| 层级约束 | **Goal→Project→Task→Session 强约束** | 项目/任务 | 项目/任务 | 任务/习惯 | 单层 | 任务 |
| 逻辑日（跨零点） | **支持（day-start cutoff）** | 无 | 无 | 无 | 无 | 无 |
| 桌面挂件 | **6 个独立窗口挂件** | 无 | 无 | 无 | 手机为主 | 无 |
| 中文文档 | **完整双语** | 英文为主 | 英文 | 英文 | 英文 | 英文 |
| AI | 无（明确非目标） | Sunny 助手 | 深度 AI | AI 排程 | AI 输入 | Aki 助手 |

### 1.3 差异化结论

**真正的护城河（4 条，建议在对外文案里反复讲）**

1. **计划准确度是可计算的**：Time Accuracy / Schedule Accuracy（±15m 容差）/ Completion Accuracy / Start Delay / Unplanned Work 的复合指标——竞品只做"时间花在哪"，Tilo 做的是"你对自己时间的判断是否可信"。
2. **复盘是审计级不可变的**：`revision + 1` 递增、封存后不可篡改——这是给"自我诚实"提供的技术保证，也是竞品完全没有的心理锚点。
3. **本地优先 + 可导出 = 反脆弱**：2026 年 Clockwise 关停、数据被删除的事件是最好的营销素材。Tilo 不会因为公司被收购而消失。
4. **强约束的领域模型**：不许自定义对象类型、子任务严格一层——换来的是指标永远可比、复盘永远一致。这是"有主张的产品"（opinionated），而不是又一个 Notion。

**被低估但尚未变现的资产**

- `AutoPackModal`（自动打包空闲时段）已经存在，但入口很深。在"AI 自动排程"成为赛道默认叙事的当下，这是一个**无需 AI、纯确定性算法**的差异化答案，值得提到台前。
- 6 个桌面挂件（Tauri 多窗口）是竞品完全没有的形态，但目前 widget 模块**几乎未接入 i18n**（15 个文件硬编码中文，最多的 `StandaloneWidgetShell.tsx` 有 24 处），无法作为英文卖点展示。
- 完整双语文档对中文用户是真优势，但 README 的亮点区偏技术罗列，没有把"为什么和 Todoist 不一样"讲清楚。

**必须直面的短板**

| 短板 | 影响 | 建议姿态 |
|---|---|---|
| 无日历集成（会议不可见） | 重度日历用户难以把 Tilo 当主日历 | 不必做双向同步（违背本地优先），但可先做 **只读 iCal 订阅**（F-002）作为 overlay |
| 无 AI | 2026 年默认期待 | 坚持"建议而不假设"，但把确定性建议（AutoPack、Next Up、容量预警）做强，用可解释性对抗"AI 黑箱" |
| 移动端非全功能 | 与竞品"手机能做全部"形成对比 | 明确"手机=捕获与执行"的定位并写进产品，而不是回避 |
| 无自动排程 | 与 Motion/Reclaim 正面对标时吃亏 | 差异化话术：自动排程让你"省掉判断"，Tilo 要让你"练准判断" |

---

## 2. 用户体验审计（基于代码事实）

### 2.1 信息架构

- 路由集中在 `src/App.tsx:107-121`，共 11 条，结构清晰。
- **缺口 A：没有 `/tasks` 全任务视图**。任务散落在 Today / Project / Goals / 挂件四个入口，用户无法回答"我到底有多少未完成的事"。
- **缺口 B：没有 `/projects` 索引路由**，只有 `/projects/:id`。项目列表寄生在 Goals 页底部，侧边栏只导航到 `/goals`。
- 影响：这两个缺口直接削弱"审查自己的承诺"这一核心动作，而它恰恰是 Tilo 区别于待办应用的关键。

### 2.2 核心旅程体检

| 环节 | 评分 | 亮点 | 断点 |
|---|---|---|---|
| **Capture 捕获** | 8/10 | `C` 全局速记、URL 自动提取、NLP 解析（日期/时长/优先级/项目）、连续处理模式（`P`） | 挂件模块未 i18n；移动端输入法 composition 已修复（v1.3.0） |
| **Plan 规划** | 6/10 | 时间轴拖拽建块、15 分钟吸附、AutoPack 自动打包 | `TodayPage.tsx:506` 与 `SidePlanningDrawer.tsx:172` 的排期**只有拖拽、无键盘/按钮替代**（违反 AGENTS.md 第 10 条）；AutoPack 入口过深 |
| **Execute 执行** | 7/10 | Next Up 建议引擎（带理由）、Focus #1–#3、浮动计时器、禅模式 | 放弃计时后声音残留（已修）；反馈通道 3 套并行易重复打扰 |
| **Actual→Analyze** | 5/10 | 指标模型完整（analyticsService 733 行） | **Analytics 页无顶层空态**：新用户看到 4 张 0 值卡片 + 空图表，且无任何"这些数字是什么意思"的解读 |
| **Review 复盘** | 6/10 | 6 步周复盘、规则化叙述、不可变修订 | 入口深、仪式重、无"跳过/轻量版"路径 |

### 2.3 一致性债务（最需要尽快处置）

- **28 个文件各自手写弹窗外壳**（`fixed inset-0 z-...`），而唯一的共享壳 `ui/BottomSheet.tsx`（含 `role="dialog"` / `aria-modal` / Esc / 安全区）只有 `ConfirmDialogHost` 在用。
  - z-index 四种取值混用：`z-50`（21 处）、`z-[9999]`（6 处）、`z-40`、`z-[60]`
  - 遮罩色四种：`bg-slate-900/40` / `/50` / `bg-black/60` / `bg-black/30`
  - 入场动画三种：`zoom-in-98` / `zoom-in-95` / `slide-in-from-bottom-6`
  - 多数缺 Esc 关闭与焦点陷阱
- **3 套反馈机制并行**：`uiStore.addToast`（主）+ Capacitor 本地通知（专注结束）+ 触觉反馈，无统一抽象层，同一事件可能重复打扰。
- **i18n 覆盖不足**：字典仅 226 行，却有约 95 个文件消费 `useI18n()`；大量走内联三元表达式，15 个文件直接硬编码中文（widget 模块最严重，24 处）。
- 组件级双份渲染树 3 处：`FocusHeatmapCard`、`MobileBottomNav`（3 个几乎相同的抽屉）、`GoalsPage`（grid 与 list 各渲染一遍）。

### 2.4 可访问性

- 约 140 个组件中仅 **27 个**出现过 `role` / `tabIndex` / `aria-*`。
- 约 **30 个文件**存在 `div/span + onClick` 却无 role、tabIndex、键盘处理：`GoalsPage`、`InboxPage`、`ProjectPage`、`ReviewPage`、`WeekView`、`AgendaView`、`TimelineView`、`RoadmapGanttView`、以及 widget 各网格（含用 div 实现的复选框）。
- `index.css` 定义了 `--border-focus` 但**没有全局 `:focus-visible` 规则**，仅 `Button` / `Input` 两个基础件有 `focus-visible:ring-2` —— 上述 div 按钮键盘 Tab 过去完全没有视觉反馈。
- 弹窗普遍缺 `role="dialog"` / `aria-modal`：`TaskDetailModal`、`WeeklyReviewModal`、`DailyCloseModal`、`AutoPackModal` 等均未补齐。
- 这与 AGENTS.md 第 10 条（每个交互都要考虑键盘、focus-visible、可访问名）明显不符，属于**规范已定但未执行**。

### 2.5 性能

- `AnalyticsPage.tsx:90-95` 一次性 `toArray()` 拉取 6 张全表，无限定与日期范围；`CalendarPage.tsx:67-71` 同样 5 张全表。
- `GoalsPage.tsx:74-89` 在 render body 内做 4 次 filter 计数，`:448/521` 在 `.map()` 内对每个项目再跑全量 `allTasks.filter()` → O(项目×任务)，且 grid 与 list 双树各算一遍。
- 超过 600 行的组件 ≥ 9 个（最大 `StandaloneWidgetShell.tsx` 1325 行、`TimelineView.tsx` 969 行）。
- 首包约 960kB 未做路由级代码分割（B-001 已在 backlog）。

### 2.6 首次体验

- **全仓零 onboarding / tour / 首启引导**（`onboarding|firstRun|tour|walkthrough` 零命中）。
- `seedDemoData` 在首次启动时**静默注入**演示数据（`App.tsx:46`），用户不知道数据从哪来，也没有"一键清空"提示；清空后面对全空白应用，而空态又没有 CTA 按钮（`TodayPage.tsx:496` 只有一行灰字，尽管 `handleCreateTask` 已存在）。
- 对一款"主张新方法论"的产品，这是最贵的漏洞：用户还没理解"计划 vs 实际"就被丢进了界面。

---

## 3. 改动方向与方案

### P0 — 让差异被看见（建议 v1.4）

**P0-1 首启引导 + 演示数据明示**
- 方案：首次启动弹出 3 步引导（① 这是"计划 vs 实际"的系统 ② 捕获→排期→专注→复盘一次闭环 ③ 手机端用来捕获，电脑端用来复盘）；演示数据注入时明确 toast「已载入示例数据，可在设置→数据一键清空」，并在设置区常驻该入口。
- 范围：`App.tsx`、`settings/DataBackupSection.tsx`、新增 `components/onboarding/FirstRunGuide.tsx`。
- 验收：新用户 3 分钟内能说出 Tilo 与待办应用的一个区别。

**P0-2 Analytics 页"讲人话"**
- 方案：① 补顶层空态（区分"数据不足"与"真的没有数据"两态）② 每个指标卡加一行"怎么读"+ hover 说明 ③ 加"本周一句话结论"（基于已有指标做确定性规则生成，不引入 AI）④ 从结论反链到 Today/Review 的下一步动作。
- 范围：`pages/AnalyticsPage.tsx`、新建 `analytics/InsightSummary.tsx`。
- 验收：0 数据用户看到引导而非空图表；有数据用户能不看文档理解 6 个指标。

**P0-3 补 `/tasks` 与 `/projects` 索引路由**
- 方案：`/tasks` 提供跨项目筛选/排序/分组（状态、优先级、截止、项目）的默认视图"未完成且已承诺"；`/projects` 作为项目索引页。侧边栏与移动底部导航同步加入口。
- 范围：新增 2 个页面 + `App.tsx` 路由 + `Sidebar` / `MobileBottomNav`。
- 验收：用户能在 2 次点击内回答"我这周承诺了什么、哪些没做完"。

### P1 — 还清一致性债务（建议 v1.4–v1.5）

**P1-1 统一弹窗壳**
- 方案：以 `BottomSheet.tsx` 为基础抽出 `Modal`（支持 size / 非模态 / 焦点陷阱 / Esc / 统一 z-index 分层常量），按调用频次分批替换 28 个手写壳（先换 Top 8：`TaskDetailModal`、`WeeklyReviewModal`、`DailyCloseModal`、`AutoPackModal`、`InspectorShell`、`CommandMenu`、`ContinuousProcessingModal`、`RescheduleDialog`）。
- 验收：全局 z-index 只剩分层常量；所有弹窗具备 `role="dialog"` + `aria-modal` + Esc + 焦点陷阱；`grep 'fixed inset-0'` 只剩 `Modal` 与个别布局容器。

**P1-2 拖拽的键盘/按钮替代（合规性）**
- 方案：`TodayPage.tsx:506` 与 `SidePlanningDrawer.tsx:172` 的每个可拖拽项加"排期到…"菜单（默认今天下一个空闲 30 分钟槽），时间轴块加键盘移动/缩放（`DailyFocusSection.tsx:265` 的三 sensor + ↑↓ 模式可直接复用）。
- 验收：全键盘可完成"从未排期到已排期"的完整流程；AGENTS.md 第 10 条达标。

**P1-3 无障碍基线**
- 方案：① 全局 `:focus-visible` 样式 ② 把约 30 处 `div + onClick` 换成 `button` 或补 `role="button"` + `tabIndex` + `onKeyDown(Enter/Space)`（优先 Goals/Inbox/Project/Review/Timeline/widget 网格）③ 弹窗 aria 补齐。
- 验收：键盘可遍历所有主流程；axe 扫描 0 个 critical。

**P1-4 反馈机制收敛**
- 方案：新增 `feedbackService` 统一门面，内部按"用户是否在看屏幕 / 是否在移动端 / 事件重要度"决定走 toast / 系统通知 / 触觉，禁止同一事件重复触发。

### P2 — 性能与工程（建议 v1.5）

- `AnalyticsPage` / `CalendarPage` 的 `useLiveQuery` 限定日期范围与上限；`GoalsPage` 的 render 内 filter 迁 `useMemo` 并抽出共享统计函数。
- 路由级代码分割（B-001），目标首包 < 500kB。
- 拆分 ≥600 行的巨型组件（优先 `StandaloneWidgetShell`、`TimelineView`、`InboxPage`）。
- i18n 字典扩容，优先清理 widget 模块 15 个硬编码文件。

### 定位层（不写代码，但决定上限）

- **把"本地优先"升级为对外承诺**：README 增设"数据主权"段落（无账号/无云/JSON 可导出/离线可用），并把 Clockwise 关停事件作为对照叙事。
- **把 AutoPack 提到台前**：在「未排期」区常驻"自动打包今日空闲时段"按钮——这是 Tilo 对"AI 自动排程"的答案，且完全确定性、可解释。
- **明确移动端定位文案**：「手机 = 捕获与执行；电脑 = 规划与复盘」，写进 README 与首次引导。

---

## 4. 版本节奏建议

| 版本 | 主题 | 内容 |
|---|---|---|
| **v1.4** | 「让差异被看见」 | P0-1/2/3 + 定位文案 + AutoPack 前置 |
| **v1.5** | 「一致性收口」 | P1-1/2/3/4（弹窗统一、拖拽替代、无障碍基线、反馈收敛） |
| **v1.6** | 「轻快」 | P2 性能与工程（查询范围、代码分割、组件拆分、i18n） |
| **v2.0（需用户定范围）** | 「连接外部世界」 | 只读 iCal 订阅（F-002）、本地 MCP/只读 API（对标 Open Sunsama）、可选 E2EE 同步（F-001） |

> 注：v2.0 涉及外部集成，与 AGENTS.md 第 3 条「不引入服务器基础设施」存在范围冲突，需用户明确后再动，并写入 `docs/DECISIONS.md`。

---

## 5. 明确不做（避免稀释定位）

- **不做双向日历同步**：与本地优先、离线可用直接冲突，且会把 Tilo 变成 Google Calendar 的皮肤。
- **不做云 AI 复盘**：违反"无 AI API"约束与"事实而非评判"的文案原则；若要做，只能是本地模型（F-005）且必须可关闭。
- **不开放自定义对象类型**：一旦放开，`Goal→Project→Task→Session` 的可比性消失，计划准确度指标随之失效——护城河就没了。
- **不做多人协作**：V1 明确单工作区，协作会重构整个数据模型与冲突语义。
