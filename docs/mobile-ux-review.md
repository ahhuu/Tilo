# Tilo 手机端体验审阅与改进方案

> 审阅范围：`src/`（126 个组件/页面）+ `capacitor.config.ts` + `android/app/src/main`
> 审阅日期：2026-10-19
> 状态：**只审阅，未实施**

---

## 一、总体判断

Tilo 的移动端不是"为手机设计的应用"，而是**桌面布局被压缩到 375px 宽**。骨架层（底部导航、沉浸式状态栏、返回键）做对了，但在此之上的三层都没有真正适配：

| 层级 | 现状 | 后果 |
|---|---|---|
| **架构层** | 桌面 DOM 结构直接复用，未做移动端信息架构重排 | 复杂页面（周视图、热力图、复盘向导）在手机上物理上放不下 |
| **形态层** | 19 个弹窗仍是桌面居中卡片，只有 8 个改成了 BottomSheet | 小屏溢出、按钮点不到、不符合 Android Material 规范 |
| **交互层** | hover / HTML5 拖拽 / 键盘快捷键 / `window.prompt` 四套桌面范式原样保留 | 功能在手机上**根本不存在**，而不是"体验差" |

一句话：**用户感受到的"很多操作不适合手机"，本质上是三类硬伤叠加 —— 遮挡不可达、交互不存在、尺寸点不中。**

### 做得对、需要保住的部分（避免改坏）

- `index.html:12` — `viewport-fit=cover` + `interactive-widget=resizes-content`
- `nativeService.ts:24` 沉浸式状态栏 + `:46` 状态栏明暗同步 + `:58` 返回键分发
- `Header.tsx:85` 顶部安全区；`MobileBottomNav.tsx:53` 底部安全区 + `:101` FAB 44×44
- `MobileBottomNav.tsx:150/218` 两个 Action Sheet 已 BottomSheet 化
- 页面级多列栅格几乎全部 `grid-cols-1 sm:/md:` 降级（这块做得到位）
- `SettingsPage.tsx:60` 已隐藏「桌面挂件」「快捷键」两个桌面专属 Tab
- `InspectorShell` / `SidePlanningDrawer` / `AllocationDrawer` 移动端全屏抽屉化

---

## 二、问题清单（按严重程度）

### 🔴 P0 — 手机上功能不可用 / 有数据风险

| # | 问题 | 位置 | 手机端实际表现 |
|---|---|---|---|
| P0-1 | **周视图删除按钮隐形但可点**，会静默误删 | `WeekView.tsx:168` 用命名 group `group-hover/block`，而 `index.css:298-305` 的触屏兜底白名单只列了 `group-hover`、`group-hover/item`、`group-hover/btn` 三个 → Android 上永久 `opacity:0` | 用户点卡片查看时，手指落在右上角 → 排期块被删掉，且完全看不见按钮存在。**数据风险** |
| P0-2 | **今日聚焦排序只能拖拽**，手机上等于不可排序 | `DailyFocusSection.tsx:225` 只有 `PointerSensor`（`distance:4`）+ `KeyboardSensor`，无 `TouchSensor`、无长按延迟、全项目无「上移/下移」按钮 | 在可纵向滚动的页面里，滑动浏览与拖拽直接冲突：想滚页面却触发拖拽，想排序却滚了页面 |
| P0-3 | **时间轴框选与滚动冲突**，且缺 `pointercancel` | `TimelineView.tsx:191` 按下即进入 `setIsDragCreating(true)`，无长按延迟；`:302-303` 只绑了 `pointermove/pointerup`，**无 `pointercancel`**；全项目 `touch-action` 零命中 | 浏览器判定为滚动时会派发 `pointercancel` → 状态机卡死、幽灵选区残留；反之则无法滚动时间轴 |
| P0-4 | **Android 返回键覆盖不全**，日历页"返回即退出" | `nativeService.ts:62-77` 只处理 4 个全局浮层，未覆盖 `calendarPlanningDrawerOpen`（且 `uiStore.ts:319` 默认 `true`）、More 抽屉、以及全部 Modal | 手机打开日历页即被全屏抽屉覆盖，按返回键直接跳路由/退出 App，抽屉不关 |
| P0-5 | **6 步周复盘 / 日终复盘弹窗无 `max-h`、无滚动容器** | `WeeklyReviewModal.tsx:186`、`DailyCloseModal.tsx:143` | 卡片向上下双向溢出，顶部标题与底部「完成复盘」按钮在屏幕外且滚不到 → **流程卡死，无法提交** |
| P0-6 | 新建目标 / 转化任务 / 转化笔记 / 重新排期 同样无 `max-h` 无滚动 | `CreateGoalModal.tsx:68`、`ConvertToTaskModal.tsx:61`、`ConvertToNoteModal.tsx:63`、`RescheduleDialog.tsx:73` | 底部主按钮点不到 |
| P0-7 | **手机主入口（FAB）是顶部居中卡片**，键盘弹出后被挤出视口 | `InstantCaptureModal.tsx:55`（`pt-28`）、`QuickCaptureHUD.tsx:131`（`pt-24`） | 这是手机端最高频的「闪念收集」「任务速记」，软键盘顶起后卡片被推出屏幕 |
| P0-8 | 手机核心流程用裸 `window.prompt` 输入 | `TodayPage.tsx:189/202`（新建任务）、`TimelineView.tsx:360`（容量上限） | 系统原生对话框，不继承深色主题；阻塞主线程导致计时漂移；部分 WebView 忽略默认值参数 |
| P0-9 | **今日页（默认落地页）底部间距不足** | `AppLayout.tsx:32` `pb-16`(64px) vs 底栏实际 56px + 安全区(16~48px) | 手势导航下最后 8~40px（通常正是「添加未排期任务」按钮）永久藏在底栏后面 |
| P0-10 | 日历控制条 5 组按钮不换行，横向溢出 | `CalendarPage.tsx:314` 无 `flex-wrap`，组内合计约 540px | 360px 屏可用宽仅 328px → 横向滚动或文字竖排，「新建时间块」等主操作不可用 |
| P0-11 | 收集箱批量条与底栏重叠且宽度溢出 | `InboxBatchBar.tsx:23` `z-40 bottom-6`，内容宽约 447px | 与底栏同为 z-40 且 DOM 在前 → 被完全遮挡；360px 屏左右各溢出 44px，Delete 按钮被切 |

### 🟠 P1 — 主要功能有明显障碍

| # | 问题 | 位置 |
|---|---|---|
| P1-1 | **HTML5 拖放排期在触屏 100% 失效**（WebView 不为 touch 派发 dragstart/drop），而文案仍在引导"拖拽" | `TodayPage.tsx:462`、`TimelineView.tsx:263/421`、`WeekView.tsx:134`、`SidePlanningDrawer.tsx:167` |
| P1-2 | 悬浮计时器 `z-40 bottom-6` **压住底部导航**，且内容宽约 400px 横向溢出 | `FloatingTimer.tsx:168` |
| P1-3 | 专注沉浸模式 `min-h-[560px]` 写死 + 无滚动 → 小屏底部控件被裁；`z-9999` 非合法 Tailwind 类 | `FocusZenModal.tsx:167/174` |
| P1-4 | 目标卡 +/− 步进器仅 **16×16px**；Inbox 多选 checkbox 默认 **13×13px** | `GoalCard.tsx:145/169`、`InboxPage.tsx:654` |
| P1-5 | 周视图 7 列每列仅 40px，方块标题全变成"…"；操作按钮 14~18px | `WeekView.tsx:65/170` |
| P1-6 | 时间轴拖拽缩放手柄 **8px 高**；播放/删除按钮 18px；空态文案仍写"按住**鼠标**框选" | `TimelineView.tsx:575/807/646/660/849` |
| P1-7 | 安全区变量 `--sat/--sab` 与 `.pt-safe/.pb-safe` 是**死代码**（0 处使用）；底部/左右安全区大面积缺失 | `index.css:47-51/197-201` |
| P1-8 | 8 个弹窗仍是桌面居中卡片（有滚动兜底但形态错误）：`RevisionHistoryModal`、`EditNoteModal`（`max-w-3xl`）、`AnalyticsCustomizerModal`、`CreateProjectModal`、`WidgetSettingsModal`、`ContinuousProcessingModal`（footer 无安全区）、`CreatePlannedBlockModal`、`CommandMenu` | 见"速查表" |
| P1-9 | 删除确认仍用 `window.confirm` | `GoalInspector.tsx:166`、`ProjectInspector.tsx:162`、`SessionInspector.tsx:86`、`WeeklyReviewModal.tsx:120` |
| P1-10 | 日历页默认 `calendarPlanningDrawerOpen: true`，手机一进页面就被全屏抽屉盖住 | `uiStore.ts:319` |
| P1-11 | 桌面快捷键在手机上仍占用逻辑（含单键 `c` / `[` 抢字符、全局 `paste` 拦截）；`CommandMenu` 宣传的 `G X` 序列实际**未实现** | `GlobalKeyboardShortcuts.tsx:46/53/59`、`CommandMenu.tsx` |
| P1-12 | 原生能力仅状态栏+返回键：无 Haptics 震动、无键盘适配（沉浸模式下输入框会被软键盘遮挡）、无本地通知（**专注计时切后台即被 WebView 节流，计时不可靠**） | `nativeService.ts`（仅 113 行）、`package.json` |
| P1-13 | 目标页 4 个状态 Tab 约 392px 不换行；年度热力图硬编码 `min-w-[680px]` 且格子 10px、`onMouseEnter` 触屏永不触发 | `GoalsPage.tsx:229`、`FocusHeatmapCard.tsx:80/87` |
| P1-14 | 手机端**无法进入项目页**，`MobileBottomNav` 的更多抽屉只有 goals/analytics/review/settings | `MobileBottomNav.tsx:37-42`、`Sidebar.tsx:100`（`hidden md:flex`） |
| P1-15 | `isMobile` 判断读 `window.innerWidth` 但无 resize 监听，横屏/折叠屏展开时桌面专属 Tab 会重现 | `SettingsPage.tsx:44`、`LanSyncModal.tsx:47` |

### 🟡 P2 — 打磨项

- Toast 容器 `bottom-4 right-4` 与底栏重叠、无安全区（`ToastContainer.tsx:15`）
- `TodayLayoutCustomizer` `w-84`(336px) + `z-40`，320px 屏溢出（`:51`）
- `WidgetLauncherPopover` `absolute z-50` 被困在 `Header`(z-20) 堆叠上下文内（`:154`）
- Tooltip 纯 hover 驱动，触屏永不显示；hover-only 详情（热力图、生物钟矩阵、准确率公式说明）触屏不可达
- 全站弹窗无 body 滚动锁定、无 `overscroll-contain`、无 `aria-modal`、无 focus trap
- 文字截断 `max-w-[120px]`（目标名）、`max-w-[200px]`（模板名）在窄屏信息丢失
- 桌面措辞泄漏：「按住鼠标框选」「可拖拽至时间轴」「支持键盘单键」「Ctrl+Shift+Space」
- 根容器用 `h-screen` 而非 `100dvh`；viewport 禁用缩放（`user-scalable=no`，违反 WCAG 1.4.4）
- 未适配 BottomSheet 的弹窗共 **19 个**（清单见下）

```
goals/CreateGoalModal                  ❌ 无 max-h        projects/CreateProjectModal        ✅有滚动 ❌居中
review/WeeklyReviewModal               ❌ 无 max-h+confirm inbox/EditNoteModal              ✅有滚动 ❌max-w-3xl
review/DailyCloseModal                 ❌ 无 max-h        review/RevisionHistoryModal        ✅有滚动 ❌居中
calendar/CreatePlannedBlockModal       ✅有滚动 ❌居中     analytics/AnalyticsCustomizerModal ✅有滚动 ❌居中
task/RescheduleDialog                  ❌ 无 max-h        widget/WidgetSettingsModal         ❌居中
inbox/ConvertToTaskModal               ❌ 无 max-h        settings/DataBackupSection(L423)   ❌无 max-h（破坏性操作！）
inbox/ConvertToNoteModal               ❌ 无 max-h        global/WindowCloseConfirmModal     ❌桌面专属
inbox/ContinuousProcessingModal        ❌footer 无安全区  global/CommandMenu                  ❌顶部卡片
global/InstantCaptureModal             ❌顶部卡片（主入口）global/QuickCaptureHUD             ❌顶部卡片（主入口）
sessions/FocusZenModal                 ⚠️ 已 portal 但 min-h-[560px] 溢出
```

---

## 三、改进方案

### 先定一个方向性问题（建议先回答再动手）

手机端是**"桌面完整镜像"**还是**"聚焦收口"**？这决定了后面一半工作量的取舍：

- **A. 完整镜像**：所有页面都要能在手机上用 → 周视图、年度热力图、6 步复盘向导都必须在小屏重做信息架构，工作量最大。
- **B. 聚焦收口（推荐）**：手机端定位为「今日执行 + 快速收集 + 轻量查看」，分析/复盘/周视图这类重页面在手机上**降级为摘要视图 + "在电脑上查看"引导**，把复杂编辑留给桌面端。

我的建议是 **B**。理由：Tilo 是 Desktop Web First（Master Plan 已定），手机端的核心价值是"随时收集 + 随时推进今日"，把 680px 宽的热力图硬塞进 375px 屏对谁都没好处。

---

### Phase 1 — 止血（1~2 小时，纯修 Bug，不改结构）

| 动作 | 说明 |
|---|---|
| 修隐形删除按钮 | `index.css:299-305` 白名单改为**扫描式兜底**：对触屏设备把所有 `opacity-0` 的 hover 操作按钮统一设为可见。手写白名单已腐烂（含一个代码里根本不存在的类名），这是根因 |
| 修底部三层浮层打架 | 统一为**单一来源**：`FloatingTimer` / `InboxBatchBar` / `Toast` 的 `bottom` 改为 `--floating-bottom`（= 底栏高 + 安全区 + 间距）；`InboxBatchBar` 改为贴底全宽工具条 |
| 修主内容区底部间距 | `AppLayout.tsx:32` `pb-16` → `pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)]`，并移除各页面硬编码的 `pb-20/pb-24`，避免两处不一致 |
| 修横向溢出 | `CalendarPage.tsx:314`、`GoalsPage.tsx:229` 加 `flex-wrap`；`FocusHeatmapCard` 的 `min-w-[680px]` 改为按月分页或动态缩放 |
| 修 P0 弹窗无高度约束 | 给 `WeeklyReviewModal` / `DailyCloseModal` / `CreateGoalModal` / `ConvertTo*Modal` / `RescheduleDialog` / `DataBackupSection` 补 `max-h-[88vh] + overflow-y-auto`（最小改动，先让按钮可达） |
| 修返回键 | `nativeService.ts` 改为**通用遮罩栈**：任何 `z-50` 遮罩存在时返回键关闭最上层，而非逐个浮层白名单 |
| 修日历默认抽屉 | `uiStore.ts:319` 移动端初始化为 `false` |
| 关掉手机端快捷键 | `GlobalKeyboardShortcuts.tsx` 顶部加 `if (nativeService.isNative()) return;` |

### Phase 2 — 建移动端基础层（杠杆最大的一步）

现在 19 个弹窗各自手写适配，已经出现 3 套不一致写法。**先抽公共层，再收敛**，否则每加一个弹窗就多一处 bug。

1. **`BottomSheet` 基础组件**（照抄 `LanSyncModal.tsx:305-318` 这套已验证的模板）
   - 遮罩 `items-end sm:items-center` + `p-0 sm:p-4`
   - 卡片 `rounded-t-2xl sm:rounded-2xl` + `max-h-[88vh]` + 把手条
   - 底部 `pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]`
   - 内置：body 滚动锁定、`overscroll-contain`、`aria-modal`、focus trap、下滑关闭手势
2. **`SafeArea` 布局容器**：把 `index.css` 里的 `--sat/--sab` 死变量真正用起来，主内容区/页面根容器统一套一层
3. **触控尺寸 token**：`min-h-11 min-w-11`(44dp) 落到 `Button`/`IconButton` 基础组件，而不是逐个组件补
4. **确认对话框**替换 `window.confirm/prompt`：自建 `ConfirmDialog` 或接入 `@capacitor/dialog`，8 处全部替换

然后把 19 个弹窗逐个迁到 `BottomSheet`（按使用频率排：InstantCapture → QuickCaptureHUD → CreatePlannedBlock → WeeklyReview → DailyClose → …）。

### Phase 3 — 交互范式重建（手机端真正"能用"）

| 桌面范式 | 手机端替代方案 |
|---|---|
| HTML5 拖拽排期 | 未排期任务行加「排期」按钮（复用 `TaskInspector.tsx:155` 的 `handleCreateSpecificTime`）；时间轴支持**长按 250ms 后**再进入拖拽 |
| dnd-kit 拖拽排序 | `DailyFocusSection` 加 `TouchSensor + delay:250, tolerance:8`；**并补「↑/↓」按钮**（键盘与触屏通用，也是无障碍替代） |
| hover 显示操作 | 触屏下常驻半透明；hover-only 详情（热力图/生物钟/公式说明）改为**点击展开** |
| 键盘快捷键 | 手机端隐藏提示文案；桌面文案里的「鼠标」「拖拽」「Ctrl+...」按平台切换措辞 |
| 右键菜单 | 改为长按上下文菜单（目前项目无右键菜单，只需为新增手势预留） |
| — | 新增 swipe 手势：Inbox 左滑归档 / 右滑转任务；任务行左滑完成 |

同时补上被遗漏的入口：`MobileBottomNav` 更多抽屉加入「项目」。

### Phase 4 — 原生能力补齐

- `@capacitor/haptics` — 完成/删除/拖拽的触感反馈（缺失时手机操作"没实感"）
- `@capacitor/keyboard` — 软键盘适配，配合已开启的沉浸式 `overlay: true` 必须处理，否则输入框被键盘吃掉（P0-7 的根因之一）
- `@capacitor/local-notifications` — **专注计时切后台必须靠本地通知兜底**，否则 `setInterval` 被 WebView 节流，计时不准
- `@capacitor/share` — 报告/备份导出走系统分享
- `AndroidManifest` 补 `android:windowSoftInputMode="adjustResize"`

### 优先级建议

```
Phase 1 止血        →  立即可做，1~2h，解决"点了没反应/误删/卡死"
Phase 2 基础层      →  收益最大，避免后面每个弹窗重复踩坑
Phase 3 交互重建    →  决定手机端"好不好用"
Phase 4 原生能力    →  决定"像不像一个原生 App"
```

---

## 四、需要确认

1. **手机端定位**：完整镜像（A）还是聚焦收口（B）？这决定 Phase 3 的深度。
2. **是否允许新增依赖**：Phase 4 的 4 个 Capacitor 官方插件，以及 swipe 手势是否引入 `react-swipeable`（AGENTS.md 第 9 条要求新增依赖需记录理由）。
3. **实施节奏**：一次性做完四个 Phase，还是先做 Phase 1+2 出一版验证？
