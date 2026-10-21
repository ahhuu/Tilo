# Tilo — Development Status

> This file is the handoff checkpoint for the next AI agent session.
> Keep it concise, factual, and updated after every development session.

## Current phase

**Phase 28 — Mobile UX Phase 3 (Interaction Reconstruction), Phase 4 (Native Capabilities) & Symmetric LAN Sync (v1.3.0) — COMPLETE & VERIFIED (2026-10-21)**
**Phase 29 — v1.4「让差异被看见」P0（首启引导 + 分析页说人话 + 任务/项目索引路由）— VERSION BUMPED 1.4.0, PACKAGING (2026-10-21)**
**Phase 30 — v1.5 一致性收口（统一 Modal 外壳 + 拖拽键盘替代 + 无障碍基线 + 反馈收敛）— VERSION BUMPED 1.5.0, 文档就绪，待验收后单条 release 提交 (2026-10-21)**

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
- [x] Phase 26 — Tauri v2 Desktop Native App & Multi-Window Desktop Widget
- [x] Phase 27 — LAN & QR Code Two-Way Sync, Android Mobile Adaptations, & Inbox Responsive Polish (v1.2.1)
- [x] Phase 28 — Mobile UX Phase 3 (Interaction Reconstruction) & Phase 4 (Native Capabilities)

---

## 1. Files changed

### 手机端体验审阅与 Phase 1+2 改造（本次会话主体）

方向决策：**手机端定位 = 聚焦收口**（今日执行 + 快速收集 + 轻量查看；分析/周视图/6 步复盘这类重页面在手机上降级为摘要，复杂编辑留给桌面端）。本次实施 Phase 1 止血 + Phase 2 基础层。

**新增基础组件**
- `src/components/ui/BottomSheet.tsx` — **[NEW]** 移动端底部抽屉 / 桌面端居中弹窗的统一基础组件。内置 `items-end + rounded-t-2xl + 拖拽把手`、`max-h-[88vh]` + 主体独立滚动 + `overscroll-contain`、上下安全区、背景滚动锁定、Esc 关闭、`aria-modal`。供后续 19 个弹窗收敛。
- `src/components/ui/ConfirmDialogHost.tsx` + `src/services/dialogService.ts` — **[NEW]** 应用内确认 / 输入对话框（命令式 `await confirmDialog(...)`），替代 `window.confirm` 与 `window.prompt`（原生对话框不继承主题、阻塞主线程打断计时、部分 WebView 忽略 prompt 默认值）。

**Phase 1 止血**
- `src/index.css` — **[FIXED]** 触屏 hover 兜底由「手写 3 个类名白名单」改为**扫描式选择器**。旧白名单漏掉 `group-hover/block`，导致周视图排期块的删除按钮在 Android 上永久 `opacity:0` 却仍可点击（静默误删）。另加 `.touch-target`（44dp 最小命中区）与拖拽手柄 `touch-action: none`。
- `src/components/layout/AppLayout.tsx` — **[FIXED]** 主内容区底部留白改为单一来源 `pb-[calc(env(safe-area-inset-bottom,0px)+4.5rem)]`（原 `pb-16` 小于底栏 56px+安全区，手势导航下今日页末屏按钮被永久遮挡）；根容器 `h-screen` → `h-[100dvh]`。
- 6 个页面移除各自硬编码的 `pb-20 / pb-24`，避免与 AppLayout 打架。
- `src/components/global/FloatingTimer.tsx` / `src/components/inbox/InboxBatchBar.tsx` / `src/components/ui/ToastContainer.tsx` — **[FIXED]** 三者原为 `bottom-4/6` 且 `z-40`，与底栏重叠甚至互相遮挡。统一为「底栏之上」偏移；批量条改为贴底全宽 + 移动端图标按钮（44×44）；计时器移动端压缩布局；Toast 改为 `inset-x-3` 避免 `w-full + right-4` 左溢出。
- 7 个 P0 弹窗补齐 `max-h-[88vh] + overflow-y-auto + 安全区` 并改为移动端底部抽屉形态：`WeeklyReviewModal`、`DailyCloseModal`、`CreateGoalModal`、`ConvertToTaskModal`、`ConvertToNoteModal`、`RescheduleDialog`、`DataBackupSection`（破坏性操作确认）。
- `src/services/nativeService.ts` — **[FIXED]** Android 返回键由「4 个浮层白名单」改为**通用遮罩栈**（按 z-index + DOM 顺序取最上层可见遮罩并触发关闭），覆盖日历抽屉、More 抽屉与全部 Modal。
- `src/stores/uiStore.ts` — **[FIXED]** `calendarPlanningDrawerOpen` 移动端默认收起（原默认 `true`，手机一进日历页就被全屏抽屉覆盖）。
- `src/components/global/GlobalKeyboardShortcuts.tsx` — **[FIXED]** 手机端直接 `return`，避免单键 `c` / `[` 抢字符输入与全局 `paste` 拦截误触。
- `src/pages/CalendarPage.tsx` / `src/pages/GoalsPage.tsx` — **[FIXED]** 窄屏控制条 / 状态 Tab 横向溢出（前者加 `flex-wrap`，后者改为横向滚动）。
- `src/components/analytics/FocusHeatmapCard.tsx` — **[FIXED]** 手机端热力图由「全年 53 周硬塞 `min-w-[680px]`」降级为**最近 12 周放大版**（14px 可点按方块），桌面端保持全年视图。

**Phase 2 基础层**
- `src/components/global/InstantCaptureModal.tsx` / `QuickCaptureHUD.tsx` — **[REFACTORED]** 手机端最高频的两个 FAB 入口由顶部居中卡片（`pt-24/28`，键盘弹出后被挤出视口）迁到 `BottomSheet`，并隐藏桌面快捷键提示。
- `src/components/calendar/CreatePlannedBlockModal.tsx` / `src/components/inbox/ContinuousProcessingModal.tsx` — **[FIXED]** 移动端底部抽屉形态 + 页脚安全区。
- 7 处 `window.confirm / prompt` 全部替换为应用内对话框（GoalInspector、ProjectInspector、SessionInspector、WeeklyReviewModal、TodayPage ×2、TimelineView）。
- 触控命中区补齐：GoalCard 指标 +/−（16px）、Inbox 多选 checkbox（13px）、WeekView 删除按钮（14px）加 `.touch-target`。

### 局域网同步修复（本次会话前半段）

- `capacitor.config.ts` — **[FIXED]** 修复局域网同步 `Failed to fetch` 根因：手机端 WebView 源为 `https://localhost`（`androidScheme: 'https'`），向 `http://<PC-IP>:27123` 发起 fetch 属于混合内容（Mixed Content），在 `allowMixedContent: false` 下被 Android WebView 直接拦截、请求根本未发出。改为 `allowMixedContent: true`（MIXED_CONTENT_COMPATIBILITY_MODE）。注意不可改回 `androidScheme: 'http'`，否则 WebView 源变更会导致手机端 IndexedDB/Dexie 数据丢失。
- `src/components/sync/LanSyncModal.tsx` — **[UPDATED]** 手机端连接失败提示补充 Windows 防火墙（专用网络放行）与路由器 AP 隔离排查项。
- `src-tauri/src/lib.rs` — **[UPDATED]** 彻底修复局域网 IP 识别被代理工具 TUN 虚拟网卡劫持的 Bug：
  1. 新增网卡过滤与评分机制，彻底剔除 `28.*`（如 Clash Meta TUN 模式）、`198.18.*`、`169.254.*`、`127.*` 等虚拟/非物理 IP；
  2. 优先匹配加权 `192.168.*`（典型 Wi-Fi 物理局域网）、`10.*` 等真实局域网私有网段；
  3. 新增 `get_all_local_ips` 命令，支持返回所有可用物理网卡供前端自由切换。
- `src/App.tsx` — **[UPDATED]** 在 Tauri 桌面端后台就绪时自动准备局域网同步 Payload 并持续监听手机端数据合并事件，手机扫码即可随时自动双向合并。

## 2. Features completed

- 修复手机端局域网/扫码同步 `Failed to fetch`：根因为 HTTPS 源请求 HTTP 局域网地址被 WebView 混合内容策略拦截（与此前 `usesCleartextTraffic` 修复相互独立），开启 `allowMixedContent` 后恢复连通。
- 错误提示覆盖防火墙 / AP 隔离等真实网络排查路径。
- **完成手机端完整审阅并输出改进方案**（`docs/mobile-ux-review.md`）：定位三类硬伤——遮挡不可达、交互范式不存在（hover/HTML5 拖拽/快捷键/`window.prompt`）、触控尺寸点不中；按 P0/P1/P2 列出全部问题并给出四阶段改造路线。
- **实施 Phase 1 止血 + Phase 2 基础层**：静默误删、浮层互相遮挡、弹窗溢出卡死、返回键失效、窄屏横向溢出等 11 项 P0 全部处理；抽出 `BottomSheet` 与 `ConfirmDialog` 两个基础件，迁移手机端最高频的两个 FAB 入口。

## 3. TypeScript / ESLint / tests / build

- `npm run typecheck` — Passed (0 errors).
- `npm run lint` — Passed (0 errors).
- `npm run test` — Passed (130/130).
- `npm run build` (Vite web) — Passed，产出 `dist/assets/index-CNkzLFZ3.js`。
- Android APK — Passed，`app-debug.apk` 已重新打包（`npx cap copy android` + `gradlew assembleDebug`）。
- **Android APK** — **Passed**：`android/app/build/outputs/apk/debug/app-debug.apk` (4.85 MB, 2026-10-19 00:29)。已校验包内 `assets/capacitor.config.json` 含 `allowMixedContent: true`，且 `assets/public/assets/index-FkjRS7Pr.js` 为最新产物（含新增防火墙/AP 隔离文案）。
  - 注：`npm run android:debug` 中的 `cap sync android` 步骤因工具批量删除保护（`capacitor-cordova-android-plugins` 57 个文件）中断，改为校验 web 资源与配置已拷贝后直接执行 `gradlew.bat assembleDebug` 完成编译；Capacitor 插件未变更，无需重生成。
- Tauri 桌面端 build — Not run（本次未改 Rust 代码，桌面端无需重编）。

## 4. Known issues

- 手机端需重新打 APK 安装后修复才生效（`capacitor.config.ts` 属于原生配置，热更新不生效）。
- 若修复后仍连不上，下一嫌疑是 Windows 防火墙拦截 Tilo 入站 27123 端口（未签名 exe 在"公用网络"配置文件下默认禁止入站）。
- 剩余未迁到 `BottomSheet` 的弹窗约 12 个（低优先，见审阅文档速查表）。

---

## Phase 28 — Mobile UX Phase 3 (Interaction Reconstruction) & Phase 4 (Native Capabilities)

> 基于 `docs/mobile-ux-review.md` 的「聚焦收口」定位推进。Phase 1+2 已交付（见上）。本阶段补齐触屏可用的替代交互 + 4 个 Capacitor 原生能力。

### 1. Files changed (Phase 28)

**Phase 3 — 交互范式重建（触屏可用替代）**
- `src/components/today/DailyFocusSection.tsx` — **[UPDATED]** `PointerSensor` → `MouseSensor`(distance:4) + `TouchSensor`(delay:250, tolerance:8) + `KeyboardSensor`；`SortableFocusItem` 新增常驻 ↑/↓ 上移下移按钮（受 `index>0` / `index<total-1` 守卫），`handleMove` 调用 `nativeService.hapticImpact('light')` + `arrayMove` + `onReorder`；提示文案改为「拖拽手柄或 ↑↓ 调整顺序」。
- `src/components/timeline/TimelineView.tsx` — **[UPDATED]** 触控长按 250ms 才进入框选（`LONG_PRESS_MS=250`），短按（无移动）直接快建 30min 时间块；新增 `pendingCreateRef` + `longPressTimerRef` + `handleGridPointerCancel`（移动 >10px 取消计时允许滚动）；`touch-action-none` 仅在 `isDragCreating` 与两个 resize 手柄激活时启用，避免误吞滚动手势；创建/缩放提交后 `hapticImpact('light')`；空状态文案补充「在网格上长按规划时间块」。
- `src/components/layout/MobileBottomNav.tsx` — **[UPDATED]** 更多抽屉新增「项目 / Projects」入口；`useLiveQuery` 拉取 `db.projects`，独立 `showProjectsSheet` 底部抽屉列出项目并可跳转 `/projects/${id}`；`isMoreActive` 纳入 `/projects`。
- `src/pages/TodayPage.tsx` — **[UPDATED]** 未排期任务行新增 `Calendar`「排期」按钮，`handleScheduleTask` 调用 `createPlannedBlock` + 可选 `rescheduleTask` 并 Toast 反馈；提示文案「点按排期或拖入时间轴」；补齐 `rescheduleTask` 来自 `@/services/taskCommands`（非 planCommands）。

**Phase 4 — 原生能力接入（新增 4 个 Capacitor 插件，已记 `DEVELOPMENT_STATUS.md` 依赖理由）**
- `package.json` — **[NEW DEP]** 新增 `@capacitor/haptics`、`@capacitor/keyboard`、`@capacitor/local-notifications`、`@capacitor/share`（v8，与现有 Capacitor 体系一致）。
- `src/services/nativeService.ts` — **[UPDATED]** 新增原生封装（均 `isNative()` 守卫 + try/catch 静默）：`hapticImpact(style)`、`hapticNotification(type)`、`setupKeyboardListeners()`（键盘显隐时滚动 `activeElement` 入屏 + 写 `--cap-keyboard-height`）、`scheduleFocusEndNotification(fireAtMs, title, body?)`、`cancelFocusNotifications()`、`shareFile(options)`、`shareText(title, text)`；`FOCUS_NOTIF_ID=4242`；`initNative` 内调 `setupKeyboardListeners()`。
- `src/services/reportExportService.ts` — **[UPDATED]** `downloadFile` 在 `isNative()` 时改用 `nativeService.shareText(...)` 走系统分享，web 路径不变。
- `src/components/global/FloatingTimer.tsx` — **[UPDATED]** 专注进入目标时长后调度本地通知兜底（`scheduleFocusEndNotification`，cleanup 时 `cancelFocusNotifications`），解决切后台 WebView 节流导致提醒丢失。
- `android/app/src/main/AndroidManifest.xml` — **[UPDATED]** `<activity>` 加 `android:windowSoftInputMode="adjustResize"`；新增 `POST_NOTIFICATIONS` 权限。
- `android/gradle.properties` — **[UPDATED]** 加 `kotlin.jvm.target.validation.mode=warning`（Capacitor v8 Kotlin 插件 JVM-target 21 vs Java 17 一致性校验放行）。

### 2. Features completed (Phase 28)

1. **触屏排序替代**：今日聚焦排序支持触控拖拽 + 常驻 ↑/↓ 按钮 + 键盘方向键三套范式，彻底摆脱「仅 HTML5 拖拽条」在手机上 100% 失效的问题。
2. **时间轴长按建立时间块**：触控长按 250ms 进入框选、短按快建 30min、滑动自动取消计时——解决「HTML5 拖拽在触屏不可用」且避免误吞滚动。
3. **底部导航补「项目」入口**：更多抽屉一键直达项目列表并跳转，补齐 Phase 3 待办。
4. **未排期任务「排期」按钮**：无需拖拽即可落时间轴，配合长按形成双通道。
5. **触觉反馈**：创建/缩放/排序均触发 `Haptics.impact`，操作有实体确认感。
6. **软键盘自适应**：`adjustResize` + 键盘监听滚动聚焦元素入屏，沉浸模式下输入框不再被遮挡。
7. **专注本地通知兜底**：切后台后 WebView 被节流时仍由系统通知提醒专注结束。
8. **系统分享导出**：报告导出在原生端走 `Share.share`，可直接转发到微信/邮件等。

### 3. TypeScript / ESLint / tests / build (Phase 28)

- `npm run typecheck` — Passed (0 errors).
- `npm run lint` — Passed (1 ESLint warning 已加 `eslint-disable` 注解处理).
- `npm run test` — Passed (130/130).
- `npm run build` (Vite web) — Passed.
- `npx cap sync android` — 注册 4 个新插件成功。
- `cap copy android` + `gradlew assembleDebug` — **BUILD SUCCESSFUL**，产物 `android/app/build/outputs/apk/debug/app-debug.apk` (5.2 MB, 2026-10-19 12:09)。
- 已恢复全局 Gradle 代理文件 `C:\Users\hhgg\.gradle\gradle.properties`（临时注释的代理行已还原）。

### 4. Known issues (Phase 28)

- 真机需重装新 APK 才能生效（`capacitor.config.ts` / 原生清单属原生层，热更新不生效）。
- swipe 手势删除、长按上下文菜单仍未做（低优先，原 Phase 3 待办中剩余项）。
- 未迁到 `BottomSheet` 的弹窗约 12 个仍未收敛（低优先）。

### 5. Next task (Phase 28)

- 真机验证：触控排序三范式是否顺手、长按建块是否误吞滚动、底部「项目」入口是否可达、专注切后台后系统通知是否准时、导出报告是否唤起系统分享面板。
- 验证通过后可选提交推送（git 提交信息纯英文，按记忆约定）。

---

## Phase 29 — v1.4「让差异被看见」P0（首启引导 + 分析页说人话 + 任务/项目索引路由）

> 依据 `docs/audit/PRODUCT_UX_AUDIT_2026-10.md`，v1.4 目标为「让差异被看见」，本轮交付 P0 三件套。版本号尚未 bump（按记忆约定，版本号在发布提交时统一升到 1.4.0）。

### 1. Files changed (Phase 29)

**P0-1 首启引导 + 示例数据告知**
- `src/components/onboarding/FirstRunGuide.tsx` — **[NEW]** 首次启动 3 步引导（规划→执行→复盘闭环 / 手机记录电脑规划 / 示例数据说明），复用 `BottomSheet` 收口 a11y（Esc、滚动锁定、`role=dialog`、焦点管理）。通过 `localStorage['tilo_has_seen_onboarding']` 去重；`DEMO_DATA_SEEDED_KEY` 导出供设置页联动。
- `src/App.tsx` — **[UPDATED]** 首次启动（含老用户升级）判定并弹出 `FirstRunGuide`；自动注入示例数据后写 `DEMO_DATA_SEEDED_KEY` 并弹「已载入示例数据，可在设置→数据一键清空」toast。
- `src/components/settings/DataBackupSection.tsx` — **[UPDATED]** 维护区新增常驻「示例数据」琥珀色提示条 + 「清空示例数据」按钮（仅示例数据存在时显示），点击走既有清空确认流；注入/重置时同步该 flag。

**P0-2 分析页说人话**
- `src/components/analytics/MetricCard.tsx` — **[UPDATED]** 新增 `hint` 属性；标题右侧加 `Info` 按钮（hover/focus 显示「怎么看」说明，`aria-label`+`title`+focus-visible 收口）。
- `src/components/analytics/InsightSummary.tsx` — **[NEW]** 纯规则生成「一句话结论」（不依赖任何 AI），按固定优先级取前 3 条洞察（专注体量 / 计划吻合度 / 计划外占比 / 启动延迟 / 完成率 / 超容量），并回链到 `/today`、`/review`。
- `src/components/analytics/AnalyticsEmptyState.tsx` — **[NEW]** 两态空状态：`none`（彻底无数据，给去今日/复盘的行动入口）与 `insufficient`（数据偏少时的温和提示，不阻断其余模块）。
- `src/pages/AnalyticsPage.tsx` — **[UPDATED]** 头条 4 张指标卡加 `hint`；插入 `InsightSummary`；用 `hasAnyData`/`showEmptyNone` 切换空状态，无数据时整体隐藏指标与洞察。

**P0-3 任务 / 项目索引路由**
- `src/pages/TasksPage.tsx` — **[NEW]** 跨项目任务视图：筛选（默认「未完成·已承诺」= `planningBucket!=='someday'` 且未完成；另含全部/已承诺/Someday/已逾期/已完成）、排序（优先级/截止日/计划日/项目/标题）、分组（不分组/按项目）。任务行支持快速完成/重开（走 `completeTask`/`reopenTask` 领域命令）与点击开 Inspector。
- `src/pages/ProjectsPage.tsx` — **[NEW]** 项目索引：列出全部项目（含任务计数、完成进度条、固定标记），点击跳转 `/projects/:id`。
- `src/App.tsx` — **[UPDATED]** 新增 `/tasks`、`/projects` 路由（`<ProjectsPage>` + `<TasksPage>`）。
- `src/components/layout/Sidebar.tsx` — **[UPDATED]** 主导航新增「任务」「项目」两项（图标 `ListTodo` / `FolderKanban`）。
- `src/components/layout/MobileBottomNav.tsx` — **[UPDATED]** 「更多」抽屉新增「任务」「项目」入口；移除原项目选择抽屉（由新的 `/projects` 索引路由取代），同步清理 `useLiveQuery`/`Project`/`showProjectsSheet` 等不再使用的引入与状态。
- `src/core/i18n/translations.ts` — **[UPDATED]** 新增 `nav.tasks` 中英词条。

### 2. Features completed (Phase 29)

1. **首启引导**：新用户（及升级老用户）首次进入即看到 3 步引导，理解 Tilo「规划→执行→复盘」闭环与双端角色分工。
2. **示例数据透明化**：首次自动注入示例数据后明确告知，并在设置→数据提供常驻「清空示例数据」入口，消除"凭空出现数据"的困惑。
3. **分析页说人话**：头条指标均有「怎么看」说明；纯规则生成的一句话结论把数字翻成行动建议，并可直接跳转今日/复盘；彻底无数据与数据偏少两态空状态。
4. **任务 / 项目索引**：新增 `/tasks` 跨项目筛选排序分组视图（默认聚焦"未完成且已承诺"）与 `/projects` 项目总览，补齐信息架构缺口；侧边栏与移动端「更多」均可直达。

### 3. TypeScript / ESLint / tests / build (Phase 29)

- `npm run typecheck` — Passed (0 errors)。
- `npm run lint` — Passed（仅 6 条 `react-hooks/exhaustive-deps` warning，均为可选依赖提示，与既有代码风格一致，非 error）。
- `npm run test` — Passed (130/130)。
- `npm run build` (Vite web) — Passed（42.5s，产物 `dist/assets/index-B64kVbNL.js`；末尾 dynamic-import chunk 提示为既有模块既有告警，与本次无关）。
- 桌面 Tauri / 手机 APK 重打包 — Not run（本轮未改 Rust 与 Android 原生代码）。

### 4. Known issues (Phase 29)

- 版本号尚未 bump 到 1.4.0（按约定在发布提交时统一升，并同步 README/CHANGELOG/RELEASE_NOTES 等）。
- "已承诺" 语义采用 `planningBucket !== 'someday'` 作为可解释实现，若后续产品上希望区分"已排入某天"与"已认领但未排期"，需再细化。
- 移动端「更多」抽屉新增两项后，小屏需确认不溢出（已用现有抽屉布局，未单独真机验证）。

### 5. Next task (Phase 29)

- 用户确认后：版本号升 1.4.0 + 同步文档 + 单一 `release: Tilo v1.4.0` 提交推送（git 提交纯英文，绕过本机 Clash 代理）。
- 视验证情况继续 v1.4 余下项或转入 v1.5（一致性收口：统一 Modal 外壳、拖拽键盘替代、a11y 基线、反馈收敛）。

---

## Phase 30 — v1.5 一致性收口（统一 Modal 外壳 + 拖拽键盘替代 + 无障碍基线 + 反馈收敛）

> 定位：不是加功能，而是把此前「每个页面各写一套」的浮层 / 拖拽 / 反馈三件事收敛成一套。版本号已 bump 到 1.5.0（按记忆约定，发布提交时压成单条 `release: Tilo v1.5.0`）。

### 1. Files changed (Phase 30)

**统一 Modal 外壳（新的唯一浮层基座）**
- `src/components/ui/Modal.tsx` — **[NEW]** 全站唯一弹窗壳。统一 `z-[9999]` 层级 + `--modal-overlay` 遮罩 token + `backdrop-blur-xs`；移动端底部抽屉 / 桌面端居中卡片；背景滚动锁；`Esc` 关闭（`dismissable` 可关）；焦点陷阱 + 关闭后焦点归还；`role="dialog"` + `aria-modal` + `aria-label`；顶部/底部安全区；`header` / `footer` / `bodyClassName` / `scrollable` / `maxWidthClass` 插槽。**容器一律不加 `select-none`**（Android WebView 中文 IME composition 红线）。
- `src/components/ui/BottomSheet.tsx` — **[REWRITTEN]** 从独立实现改为 `Modal` 的别名再导出（仅兼容旧调用方，零逻辑重复）。
- `src/index.css` — **[UPDATED]** 新增 `--modal-overlay`（明/暗两套）；新增全局 `:focus-visible` 键盘焦点环基线（含 `[role="button"]` / `.focusable`），并豁免 `[role="dialog"]` 自身。
- 迁入 `Modal` 的弹窗（20 处）：`TaskDetailModal`、`RescheduleDialog`、`RevisionHistoryModal`、`WeeklyReviewModal`、`DailyCloseModal`、`LanSyncModal`、`AutoPackModal`、`FocusFullModal`、`WidgetSettingsModal`、`EditNoteModal`、`ConvertToNoteModal`、`ConvertToTaskModal`、`ContinuousProcessingModal`、`AnalyticsCustomizerModal`、`WindowCloseConfirmModal`、`CreatePlannedBlockModal`、`CreateGoalModal`、`CreateProjectModal`、`TodayPage`（Focus Picker）、`DataBackupSection`（清空重置确认）。内部 JSX 1:1 保留，仅替换外层遮罩 + 卡片 + 手写 header/✕。
- 刻意不收口（交互模型不同）：`FocusZenModal`（全屏沉浸专注）、`InspectorShell` / `AllocationDrawer` / `SidePlanningDrawer`（侧抽屉）、`CommandMenu`（⌘K 命令面板）、`InlineCreatePopover`（锚定气泡）。

**拖拽的键盘替代**
- `src/components/timeline/TimelineView.tsx` — **[UPDATED]** 计划时间块可聚焦（`tabIndex=0` + `role="button"` + `aria-label`/`aria-roledescription`）；`↑/↓` ±15min、`Shift+↑/↓` ±1h、`Enter`/`Space` 检视、`Delete`/`Backspace` 删除；复用既有 `onUpdatePlannedBlock` 落库；`aria-live="polite"` 播报。**连按修复**：新增 `kbPendingTimesRef` 记录按键后的最新时间（原先每次都基于旧 `block.startAt`，快速连按只位移一步），并限制在当天时间轴范围内，触边播报。
- `src/components/calendar/WeekView.tsx` — **[UPDATED]** 周视图排期块同样可聚焦；`←/→` 改日、`↑/↓` 改时（限 08:00–20:00）、`Enter` 检视、`Delete` 删除；`aria-live` 播报；块内删除按钮补 `aria-label` + `focus-visible:opacity-100`；新增 `pendingMoveRef` 解决连按基准陈旧。
- `src/pages/CalendarPage.tsx` — **[UPDATED]** 新增 `handleMoveBlockOnGrid(blockId, dateStr, hour)`，经 `updatePlannedBlock` 保留原时长改期 + Toast 反馈；以 `onMoveBlock` 传入 `WeekView`。
- `src/components/calendar/SidePlanningDrawer.tsx` — **[UPDATED]** 任务卡可聚焦（`role="button"` + `tabIndex=0` + `Enter`/`Space` 检视）；`Plan` / `Today` 操作按钮改为 `group-hover` + `group-focus-within` + `focus-within` 显示（此前仅 hover，键盘用户看不到按钮）。
- `DailyFocusSection` — 已具备 `@dnd-kit` `sortableKeyboardCoordinates` + 常驻 ↑/↓ 按钮（Phase 28 交付），本轮仅确认无需改动。

**反馈收敛与无障碍**
- `src/components/ui/ToastContainer.tsx` — **[UPDATED]** 容器常驻 `role="region"`；单条 toast 按类型分流 `role="status"` + `aria-live="polite"`（info/success/warning）与 `role="alert"` + `aria-live="assertive"`（error）。
- 审计结论：全站反馈已统一走 `uiStore.addToast`（info/success/warning/error + undo），无 `window.alert`、无自建 banner / 并行 toast 通道。
- 图标关闭按钮补可访问名称：`RevisionHistoryModal`、`WeeklyReviewModal`、`LanSyncModal`、`TaskDetailModal`、`AutoPackModal`、`FocusFullModal`、`WidgetSettingsModal`、`MobileBottomNav`、`AllocationDrawer`、`InlineCreatePopover`、`TodayLayoutCustomizer`、`TodayTimeline`、`InAppWidgetShell`、`TodayPage` Focus Picker。

### 2. Features completed (Phase 30)

1. **一套弹窗**：20 个卡片弹窗共用同一外壳——层级、遮罩明度、移动端抽屉形态、滚动锁、Esc、焦点陷阱与归还、`aria-modal` 语义、安全区全部一致，不再逐页各写一套。
2. **Android 中文输入法回归根治**：旧遮罩容器上的 `select-none` 会破坏 IME composition（表现为"输入不显示、删一个字才生效"），统一壳从源头不再添加，并保留 `index.css` 的 `user-select: text` 兜底。
3. **键盘可用**：时间轴 / 周视图的排期块、规划抽屉的任务卡全部可聚焦并用方向键改期，闭合「只能拖拽」的键盘死角；连按不再只位移一步。
4. **焦点可见**：全局 `:focus-visible` 焦点环基线，键盘用户不再"找不到焦点在哪"；hover 才显示的控件在聚焦时同样显现。
5. **反馈可被读出**：toast 具备 live-region 语义，屏幕阅读器能播报成功/失败。
6. **类型检查陷阱修复**：`tsconfig.json` 是引用型空壳（`"files": []`），原 `npm run typecheck`（`tsc --noEmit`）**实际不检查任何文件**；改为 `tsc -b --force` 后真正生效（已用故意错误探针验证）。

### 3. TypeScript / ESLint / tests / build (Phase 30)

- `npm run typecheck`（修正为 `tsc -b --force`）— Passed (0 errors)。
- `npm run lint` — Passed (0 errors, 6 条既有 `react-hooks/exhaustive-deps` warning，与 Phase 29 一致)。
- `npm run test` — Passed (43 files, 130/130)。
- `npm run build`（Vite web）— Passed（`dist/assets/index-5ALVJ2Ix.js` 1858.94 kB / gzip 509.16 kB）。
- 桌面 `npm run tauri build` — **BUILD SUCCESSFUL**（3m18s）：`Tilo_1.5.0_x64_en-US.msi`（3.27 MB）、`Tilo_1.5.0_x64-setup.exe`（2.31 MB）。
- Android `npx cap copy android` + `gradlew assembleDebug --offline` — **BUILD SUCCESSFUL**（32s）：`android/app/build/outputs/apk/debug/app-debug.apk`（4.71 MB）。
- 版本号：`package.json` / `package-lock.json` / `src-tauri/tauri.conf.json` = 1.5.0；`android/app/build.gradle` = versionName 1.5.0 / versionCode 8；`src-tauri/Cargo.toml` 按惯例保持 0.1.0。

### 4. Known issues (Phase 30)

- `tsc` 不校验 JSX 标签名与组件是否已引入（本轮 4 个文件多一个 `</div>`、2 个文件漏 `import Modal`，`tsc` 均未报错）。已用 esbuild 全量扫描 + 静态审计补齐；后续新增弹窗请在构建（Vite）里验证，不要只看 `tsc`。
- `Modal` 的焦点陷阱挂在卡片 `keydown` 上：若焦点被移到 `body`（非可聚焦区域），Tab 循环会脱离陷阱（轻微边界情况）。
- 周视图键盘改期按「整点」对齐（沿用 `onMoveBlock` 的 hour 粒度），分钟级微调仅时间轴支持。
- 未做真机回归：Android 中文输入法、TalkBack 播报、桌面安装包安装启动均待在验收阶段实测。

### 5. Next task (Phase 30)

- 用户验收：桌面安装包与 Android APK 实测（弹窗形态/滚动锁/Esc/焦点、时间轴与周视图方向键改期、toast 播报）。
- 验收通过后：压成单条 `release: Tilo v1.5.0` 提交并推送（纯英文提交信息，绕过本机 Clash 代理）。

## 5. Next task

- 真机验证本次 Phase 1+2：静默误删是否消失、底栏与浮层是否还打架、弹窗按钮是否可达、返回键是否逐层关闭。
- 验证通过后进入 **Phase 3 交互重建**（按「聚焦收口」定位：重页面降级 + 触屏可用的替代交互）。
- `src/pages/SingleWidgetPage.tsx` — **[UPDATED]** Enforced pure transparency by purging `bg-surface-app` from `body` and setting transparent style properties on `html`, `body`, and `#root`.
- `src/components/widget/StandaloneWidgetShell.tsx` — **[UPDATED]** Eliminated outer padding and bright white border to remove outer framing artifacts; added a dedicated "⚙️ 自定义" button in the header; added per-grid custom preference drawer with opacity slider and quick tab/filter/duration switches.
- `src/test/desktopWidget.test.ts` — **[UPDATED]** Added automated unit test coverage for standalone widget metadata and multi-window service capabilities.

## 2. Features completed

1. **Elimination of Outer Framing Artifacts (彻底消除多余白色外框与纯净半透明穿透)**:
   - 移除了外层多余内边距与高亮 `border-white/60` 边线，并在挂件加载时强制清除 `body` 上的 `bg-surface-app` 背景色；
   - 在 `tauri.conf.json` 与 `tauriWidgetService.ts` 中关闭了 Windows 原生窗口级 `shadow: false`，彻底根除了 Windows 矩形发光白框，呈现纯粹悬浮的亚克力圆角挂件。

2. **Deep Per-Grid Distinct Customization (每个组件格子深度专属差异化定制)**:
   - 每个挂件顶栏提供专属 **「⚙️ 自定义」** 抽屉，彻底杜绝千篇一律的简单配置：
     - **闪念收集**：自定义初始标签（未整理/灵感/全部）、一键推入目标（今日聚焦/待办）、卡片布局密度（舒适多行/紧凑单行）；
     - **今日待办**：自定义展示视图（聚焦/今日/全部）、排序偏好（按优先级优先/创建时间）、展示已完成开关、优先级色彩指示开关；
     - **专注计时**：自定义默认时长（15/25/45/60m/自由正向秒表）、环境音/白噪音联动切换（雨声/白噪音/鸟鸣/壁炉炭火，与项目音频服务打通）、计时结束自动勾选完成任务开关；
     - **今日日程**：自定义跨度（仅接下来的计划/全天）、进行中日程脉冲动态光效开关；
     - **随手便签**：自定义便笺纸张主题（经典浅白/暖黄便利贴/清凉薄荷/极客暗黑）、排版字体族（现代无衬线/等宽代码字体）、字号调节（小/中/大）；
     - **通用外观**：自由滑动调节半透明度（40% ~ 100%），即调即显，支持一键恢复出厂设置。

3. **Markdown-Powered Scratchpad Note (随手便签全面升级 Markdown)**:
   - 新增【写作编辑】与【渲染预览】Tab 实时切换；
   - 支持全套 Markdown 语法渲染：各级标题、粗体、斜体、引用块、代码块等；
   - **交互式复选清单打勾**：在预览模式下直接点击清单复选框，自动同步更新底层 Markdown 源码并保持持久化；
   - 编辑器内置快捷排版工具栏（粗体、斜体、标题、待办清单、引用、代码块）；
   - 支持一键复制 Markdown 源码与直接导出为 `.md` 本地文件。

4. **Official Tilo Brand Application Icons (全套官方 Tilo 桌面应用图标)**:
   - 基于品牌规范设计了高清 Squircle 风格的官方应用图标源文件 `public/app-icon-source.svg`；
   - 通过 `tauri icon` 生成了全套多尺寸的 Windows 原生图标（`icon.ico`、`32x32.png`、`128x128.png`、`icon.icns` 等）；
   - Windows 原生可执行程序（`app.exe`）以及安装程序（NSIS `.exe` 与 MSI `.msi`）均已统一使用官方 Tilo Logo。

5. **Multi-Widget Desktop Auto-Alignment (桌面挂件一键智能贴边对齐)**:
   - 在主界面「桌面挂件」管理浮层以及 APP「设置」专区中提供「一键对齐排列」快捷工具：
     - **靠桌面右侧整齐排列**：自动获取主屏幕物理与逻辑工作区，将桌面打开的所有挂件窗口依次向下贴靠右边垂直排列，间距优雅均等（12px）；
     - **靠桌面左侧整齐排列**：将所有挂件窗口依次向下贴靠左边垂直排列；
     - **屏幕中央叠层归位**：插拔多屏或窗口移出视野时，一键全部召回并以精致层叠方式回归屏幕中央。

6. **Dedicated Desktop Widgets Section in App Settings (APP 设置新增桌面挂件管理区)**:
   - 在 `SettingsPage.tsx` 新增 **「桌面挂件」** 专属配置 Tab (`WidgetSettingsSection.tsx`)；
   - 集中统一管控开机启动行为、开机自动在桌面打开快捷格子、全局毛玻璃半透明度滑块、默认始终置顶开关、以及 5 款格子的桌面运行状态。

7. **Windows Launch at Startup / Autostart Integration (Windows 原生开机自启动支持)**:
   - 引入官方标准的 `tauri-plugin-autostart = "2"` 与前端 `@tauri-apps/plugin-autostart` 依赖；
   - 在 APP 设置中一键开关开机自动启动，实时写入 Windows 注册表启动项；
   - 支持联动设置“开机自启时自动在桌面显示挂件”，实现真正开机即用。

8. **Real-time Drag Alignment Snap & Guidelines (桌面拖拽实时四向对齐导引与磁吸)**:
   - 彻底优化对齐微光边线与徽标的保持时间与消失判定机制：
     - 延长微调观察宽容度至 2.4 秒（2400ms），拖动或微调停留期间导引线持续稳定高亮，绝不在微调对齐途中过早淡出；
     - 联动全局 `mouseup`、`pointerup`、`blur` 事件，在用户真正松开鼠标完成对齐放置后才平滑淡出，完美兼顾灵敏度与辅助体验；
     - 徽标文字彻底去重，规范为单行极简胶囊样式，杜绝变形撑大。

9. **Close Window Action Confirmation & System Tray (关闭主窗口行为确认与系统托盘)**:
   - 彻底修复关闭应用后任务栏托盘图标残留（假死无响应）问题：
     - 在 Rust 端注册 `exit_app` 原生指令并在退出时执行完整进程终结与托盘资源释放，确保彻底退出时 Windows 托盘图标立即消失，不再残留任何幽灵图标；
     - 放宽托盘点击判定（无论是鼠标左键按下还是松开均即刻响应），修复单击托盘无反应问题，单击托盘即可平滑唤起、取消最小化并置顶聚焦主窗口。

10. **HashRouter & ErrorBoundary & Desktop DevTools (Hash 路由重构、错误边界兜底与调试支持)**:
    - 将 React 路由从 `BrowserRouter` 全面重构升级为 `HashRouter`：桌面客户端（Windows WebView2）加载本地文件协议时，访问物理路径不存在的 `/widget/...` 或 `/today` 会引发 404 白屏；升级为 `HashRouter` 后全部由 `index.html#/...` 分发，彻底杜绝本地文件协议 404 与路由死循环；
    - 新增全局 `ErrorBoundary.tsx` 错误捕获边界，任何潜在渲染异常均有友好卡片提示与一键重试按钮，彻底终结静默白屏；
    - 在 `src-tauri` 中开启 `devtools: true` 并在系统托盘菜单中新增「打开开发者工具 (调试)」入口，支持按 F12 随时查看控制台网络与控制台日志。

13. **Pure Desktop Gadgets (纯粹桌面小组件：透明贴桌、无任务栏图标、自由拖拽缩放与磁吸对齐)**:
    - 响应用户最新要求“组件是在桌面上，而不只是局限于在APP内”，将 5 大挂件定位为 Windows 桌面原生小部件；
    - 在挂件配置中开启 `skipTaskbar: true`、`transparent: true`、`decorations: false`、`shadow: false`：在 Windows 任务栏上**绝不产生任何多余窗口图标**，Alt+Tab 中不产生多余应用干扰；
    - 挂件直接贴合在 Windows 桌面上，支持桌面任意位置自由拖拽移动、右下角拖拽拉伸缩放尺寸（Resize）；
    - **彻底修复拖动挂件对齐触发时机**：针对用户反馈“长按自定义按钮才出现对齐，长按拖动挂件却不出现”，查明系 `data-tauri-drag-region` 触发 Win32 模态拖拽导致 JS `setInterval` 挂起；全面升级为 Tauri 原生 `win.onMoved` 系统级事件监听与 `win.startDragging()`，拖动挂件任意位置移动时毫秒级实时计算磁吸对齐并呈现微光导引线；
    - 各挂件支持专属独立配置（Markdown 便签双模式、白噪音音频、待办排序、透明度调节）；
    - Tilo 主应用顶栏与系统托盘菜单一键控制开启、隐藏与智能靠右/靠左整齐排列。

14. **Autostart & Desktop Widgets Auto-Launch Lifecycle (开机自启与桌面挂件自动呼出全生命周期)**:
    - 针对用户反馈“开启了开机自启动和自动显示挂件，但重启后没有显示组件”，查明系应用启动时缺失检测与挂件唤起调度；
    - 在 `App.tsx` 根组件初始化中加入检测 `tauriWidgetService.isAutoLaunchWidgetsOnStartup()`：当开启时，等待应用就绪后自动根据 `enabledGrids` 逐一唤出用户启用的桌面挂件并执行右侧贴边排列；
    - 在 `src-tauri/src/lib.rs` 的 setup 钩子中增加对 `--autostart` 命令行参数的静默检测：开机启动时主窗口自动静默最小化至托盘，不弹大窗遮挡桌面，只在桌面上轻盈展示桌面挂件。

15. **Full Desktop Widget Layout & State Persistence (挂件坐标、尺寸、置顶与状态精准持久化)**:
    - 针对用户反馈“排列状态和各种设置要准确回到我一个时刻的状态。现在就算只是重启Tilo软件都要重新打开并排布组件，没有持久化”，彻底重构桌面挂件持久化模型：
    - **位置与尺寸实时记录**：在 `win.onMoved` 与 `win.onResized` 原生事件中，实时防抖持久化每个小组件在桌面上的精准物理坐标 `(x, y)` 与拉伸尺寸 `(width, height)` 至 `localStorage`；
    - **开启与置顶状态记录**：打开挂件时标记 `isOpen: true`，关闭时标记 `isOpen: false`，切换置顶 Pin 时保存 `isPinned`；
    - **重启/开机精准原位还原**：在 `App.tsx` 启动入口中，自动读取上一次正在打开的挂件列表，并逐一还原各自上次摆放的具体坐标、尺寸与置顶属性，**坚决不调用会重置位置的靠右对齐**，让桌面挂件完完全全、分毫不差地回到上一个时刻！

16. **Drag-to-Timeline Scheduling & Task Attributes Auto-Sync (拖拽排期与任务排期日期、工时、截止日期自动同步)**:
    - 针对用户反馈“1. 日历排期抽屉与今日未排期任务拖拽不了到时间轴；2. 拖拽排期设置时间块时，排期日期、截止日期和预估工时应同步回原任务”：
    - **彻底修复未排期任务拖拽**：在 `TodayPage` 中为 `TodayTimeline` 注入未排期任务列表，并在 `TimelineView.tsx` 中增加 `db.tasks.get(taskId)` 异步兜底查询，彻底消除未排期任务在 `taskMap` 查不到导致静默丢弃的问题；
    - **日历周视图拖拽排期打通**：在 `WeekView.tsx` 每个时间槽位绑定 `onDragOver` 与 `onDrop` 事件，并支持直接从排期抽屉拖拽卡片到周视图任意一天的任意小时，自动创建时间块；
    - **原任务属性自动精准同步**：在 `planCommands.ts` 的 `createPlannedBlock` 与 `updatePlannedBlock` 数据库事务中，自动联动关联原任务：将排期日期 `scheduledDate`、时间块预估分钟数 `estimateMinutes` 和截止日期 `dueDate` 毫秒级同步写入 `database.tasks`，无需手动重复填写。

17. **Fix Windows WebView2 Drag-and-Drop Red Forbidden Cursor (彻底根除 Windows 桌面拖拽红色禁止符号)**:
    - 针对用户反馈“拖拽功能还是不行，显示红色禁止符号”，深入查明底层核心机制：
    - 在 Windows 平台上，Tauri 默认开启系统级文件拖拽监听（`dragDropEnabled: true`），该特性会强制拦截 WebView2 的 OLE 拖放事件，导致前端 HTML5 元素拖拽被系统判定为无效文件操作，从而在整个视口渲染红色禁止符号（Not Allowed Cursor）；
    - 在 `src-tauri/tauri.conf.json` 与动态窗口配置中正式将 `"dragDropEnabled": false` 写入配置，按照 Tauri 官方技术规范解除底层 OLE 拦截，将拖放控制权彻底归还前端；
    - 在 `TimelineView` 与 `WeekView` 最外层容器与时间槽位全链路补齐 `onDragOver` 与 `onDragEnter` 阻止默认拦截并声明 `dropEffect = 'copy'`，拖拽体验彻底恢复丝滑顺畅。

- [x] Phase 27 — Desktop Widgets Experience Polish, Capsule Mode, Goals Widget & Appearance Customization

---

## 1. Files changed

- `src/components/widget/grids/InboxGrid.tsx` — **[UPDATED]** 排除已转化与已归档灵感，修复灵感分类计数与实际列表不一致问题。
- `src/components/widget/grids/TasksGrid.tsx` — **[UPDATED]** 今日分类剔除未排期任务；专注会话自动读取任务预估工时。
- `src/components/widget/grids/SessionGrid.tsx` — **[UPDATED]** 任务选择自动同步预估工时并更新倒计时；支持卡片与极窄灵动胶囊条（Mini Capsule）双模态切换与窗口动态尺寸调节。
- `src/stores/uiStore.ts` — **[UPDATED]** 增加 `runningSession` 的 `localStorage` 广播与原生 `storage` 跨多窗口事件监听，实现跨挂件窗口秒级专注联动。
- `src/components/widget/grids/NotesGrid.tsx` — **[UPDATED]** 升级 Markdown 语法排版工具栏（表格、链接、待办、标题、代码块）；新增分栏实时对照模式；支持一键转存正式知识库笔记。
- `src/components/widget/widgetTypes.ts` — **[UPDATED]** 注册 `goals` 目标看板挂件类型；添加 `WidgetAppearanceSettings` 外观配置类型；在 `SessionGridSettings` 中扩展 `isCapsuleMode`。
- `src/stores/widgetStore.ts` — **[UPDATED]** 实现 `updateAppearance` 外观配置持久化；新增 `storage` 与 Tauri 原生事件广播及跨窗口实时双向同步监听，确保主应用调节外观时所有挂件窗口毫秒级响应。
- `src/services/tauriWidgetService.ts` — **[UPDATED]** 将 `getVisibleWidgetIds` 中的硬编码列表改为动态读取 `WIDGET_METAS`，彻底修复目标看板挂件在桌面激活时设置卡片仍显示为未激活（“打开”）的严重状态 Bug。
- `src/stores/uiStore.ts` — **[UPDATED]** 增加 `language` 与 `theme` 的跨窗口原生 `storage` 监听与 Tauri 全局广播事件（`tilo:language-changed`），实现主应用切换英文时所有桌面独立挂件窗口毫秒级热更新，彻底消除语言切换滞后问题。
- `src/components/settings/WidgetSettingsSection.tsx` — **[UPDATED]** 在「挂件全局外观与通用偏好」卡片标题栏新增「恢复默认 / Reset to Defaults」按钮，支持一键还原透明度、字号、字体风格、按钮规格与圆角。
- `src/components/widget/widgetTypes.ts` — **[UPDATED]** 扩展 `WidgetWindowStyle`（现代毛玻璃、曜石纯黑、极简纸质、一体化悬浮、复古赛博终端 5 款窗口质感风格）、`collapseOnDoubleClick`、`headerActionsMode`、`headerButtons`（支持置顶、配置、主题、关闭每个按钮独立设置常显/悬停/隐藏）以及 `lockLayout`（防误触拖拽锁定）；并将 `tasks.tabStyle` 默认值明确为 `'icon'`（纯图标）。
- `src/components/widget/grids/TasksGrid.tsx` — **[UPDATED]** 默认 Tab 展示样式回退值设为 `'icon'`，新打开和重置时横向最大化精简。
- `src/pages/SingleWidgetPage.tsx` — **[UPDATED]** 中文环境下全面纯净化各挂件标题（彻底移除括号英文，如 `闪念收集`、`今日待办`、`专注计时`、`今日日程`、`随手便签`、`目标看板`）。
- `src/components/widget/StandaloneWidgetShell.tsx` — **[UPDATED]** 实现 5 款窗口风格样式映射、双击顶栏一键折叠/展开（折叠为 38px 极窄顶栏条，隐藏内容区）、位置锁定拦截拖拽与光标反馈、顶栏控制按钮细粒度显隐样式计算，以及纯中文标题。
- `src/components/settings/WidgetSettingsSection.tsx` — **[UPDATED]** 在主应用「挂件全局外观与通用偏好」面板中新增 5 款窗口风格单选卡片、顶栏按钮全局与 4 个按钮单独显隐配置矩阵、双击顶栏折叠开关和锁定位置开关。
- `src/test/widgetFeatures.test.ts` — **[UPDATED]** 新增第 6 项测试用例，验证 5 种窗口风格切换、独立按钮配置与双击折叠偏好。

## 2. Features completed

1. **5 套窗口质感风格全量落地与热切换**：
   - 现代毛玻璃 (`glass`)：高斯透射、柔光边框、透明度平滑调节；
   - 曜石纯黑 (`stealth`)：OLED 纯黑、荧光绿微边框、极省 GPU 且低反光干扰；
   - 极简纸质微质感 (`paper`)：暖米白哑光实体纸张触感；
   - 一体化无界悬浮 (`floating`)：取消顶栏底线，通体漂浮一体感；
   - 复古赛博终端 (`terminal`)：黑客绿等宽代码风终端质感；
2. **顶栏控制按钮悬停显现与精细化独立定制**：
   - 全局支持在「默认静默沉浸 (鼠标移入时平滑淡入)」与「一直正常显示」之间切换；
   - 置顶、配置、主题、关闭 4 个按钮支持每个单独切换为 `常显`、`悬停` 或 `隐藏`；
3. **双击顶栏折叠与挂件位置锁定**：
   - 双击标题栏空白处瞬间收起为极窄顶栏条，桌面视野零遮挡，再次双击还原；
   - 锁定位置开启后禁用拖拽移动与边缘缩放，防止日常操作误触；
4. **中文语言下挂件标题彻底纯净化**：
   - 彻底去除英文后缀括号（如 `闪念收集`、`今日待办`、`目标看板` 等）；
5. **今日待办默认展示样式设为「仅图标」**；
6. **挂件始终置顶 (Pin) 功能全面修复**：
   - 阻止置顶按钮冒泡，在挂件独立窗口中直接驱动 `getCurrentWebviewWindow().setAlwaysOnTop(nextPin)` 与容错，挂载时自动同步物理窗口置顶状态并附带明确 Toast 提示；
7. **双击顶栏折叠/展开与拖拽对齐彻底解耦**：
   - 增加 `isResizingOrCollapsingRef` 互斥保护与 `isUserDraggingRef` 真实鼠标拖拽状态标志，在双击折叠期间及非人为拖拽移动时强制阻断并清除对齐辅助线与提示；双击时间窗口内 (<320ms) 拦截 `startDragging()`，彻底杜绝折叠时触发组件对齐；
8. **折叠形态精简与尺寸冲突彻底根治（图 1 修复）**：
   - 双击折叠状态宽度统一约束为对应挂件的官方标准默认宽度（`defaultWidth`，如 320/340/360px），高度固定为 38px，彻底消除横跨整个屏幕的长条折叠栏；展开时恢复原先展开态尺寸（异常时自动回退为标准尺寸）；
9. **折叠态脏高度清洗与防污染保护**：
   - `saveWidgetLayout` 与 `win.onResized` 严禁持久化保存低于 120px 的折叠高度；`getWidgetLayout` 自动识别并清洗历史遗留的 38px 脏高度，彻底根除“折叠后回不去默认窗口大小”的冲突；
10. **挂件拉伸内容空白 Bug 彻底修复（图 2 修复）**：
    - 在 `win.onResized` 中监听用户手动拉伸挂件边缘，当物理高度 >= 100px 时自动解除折叠状态（`setIsCollapsed(false)`），确保 `<main>` 内容立即完整呈现，杜绝窗口被拉大却空白无内容的现象；同时折叠徽标变为可点击一键展开；
11. **新增挂件一键恢复标准默认尺寸 (Reset Size)**：
    - 在挂件配置抽屉中新增「恢复标准窗口尺寸」按钮，主应用设置面板的对齐栏中同步新增「恢复所有标准默认尺寸」，支持一键将桌面所有挂件重置为黄金比例；
12. **顶栏控制按钮升级为 5 键架构（置顶与锁定位置分离）**：
    - 将「锁定挂件位置与尺寸 (防误触)」与「挂件始终置顶 (Always on Top)」明确解耦为顶栏独立按钮：
      1. `pin`：窗口层级置顶（浮在其他所有软件最前面）；
      2. `lock`：锁定位置与尺寸（按住黄色锁头彻底禁止鼠标拖拽与缩放，绝不会被误拖走）；
      3. `settings`：配置抽屉；
      4. `theme`：深浅色模式切换；
      5. `close`：关闭挂件；
    - 在主应用设置与挂件配置抽屉中，5 个按钮均支持独立设置 `常显 (Always)` / `悬停淡入 (Hover)` / `彻底隐藏 (Hidden)`；
13. **锁定粒度精细化（单窗口独立锁与全局锁分层）与 UI 重复图标清理**：
    - **单窗口独立锁定**：挂件顶栏上的锁头按钮仅针对当前窗口进行锁定与持久化（`selfLocked` 存入该挂件 layout 配置），不再联动全局；主应用设置面板中的开关专门负责「全局锁定所有桌面挂件」；
    - **清理重复锁头图标**：彻底移除标题栏文字旁的静态小锁图标，全界面只保留右侧的标准操作锁头按钮；
14. **今日待办挂件内联任务速记功能与分类排序微调**：
    - **Tab 排序调整**：将底部四个分类顺序调整为 `聚焦`、`今日`、`已完成`、`全部`（全部与已完成左右对调，已完成前置）；
    - 在切换标签样式按钮左侧常设精致微型 `＋` 按钮，平时零占用列表垂直高度；
    - **语法提示微型标签行始终常驻**：输入框有字后依然展示可点击标签（`📅 明天`、`⏱️ 30m`、`⚡ !high`、`🚨 !urgent`、`🎯 #项目`），支持连续点击追加多个特征；
    - **日期排期放开限制**：用户通过自然语言或标签指定日期（如明天、后天、周一）时优先指定日期，未指定时默认落入今日；
    - 实时解析预览胶囊（Live Chips）动态直观显示已识别的日期、工时、优先级与归属项目；
    - 支持回车无感连敲快速录入，按 `Esc` 或再次点击 `✕` 随时收起；
15. **闪念收集挂件（InboxGrid）四分类对齐与极简顶栏 `＋` 号速记展开**：
    - **顶栏极简化展开速记**：输入框同样移至顶栏右侧，以一个精致的 `＋` 号小按钮呈现，平时零占用列表空间；点击平滑展开输入条并自动获取焦点，回车存入后保持聚焦，按 `Esc` 或再次点击轻巧收起；
    - **四分类与主应用完全对齐**：
      1. `未整理`：对应待整理（未处理的 Inbox 条目）；
      2. `灵感`：对应待办池（`someday` / `idea`）与工作资料/笔记（`notes`）总和；
      3. `已归档`：对应已归档条目，支持一键恢复至未整理或彻底删除；
      4. `全部`：未整理 + 灵感（待办池+笔记） + 已归档的全部总额和；
    - **标签样式自由切换**：像今日待办一样，默认采用纯小图标展示，顶栏右侧配备 `LayoutGrid` 按钮，可随时在「纯图标 (默认) / 纯文字 / 图文并存」之间循环切换，且状态独立持久化；
    - 支持在挂件内直接查看工作资料与笔记（带专属笔记标识、复制正文与删除）。

16. **Android 移动端全方位适配与本地 Gradle 命令行构建体系**：
    - **移动端视口与安全区域（Safe Area）适配**：
      - 在 `index.html` 的 `viewport` meta 标签中加入 `viewport-fit=cover` 与 `interactive-widget=resizes-content`；
      - 在 `src/index.css` 注入 `--sat`, `--sab`, `--sal`, `--sar` 映射 `env(safe-area-inset-*)` 变量，并为移动端添加 `-webkit-tap-highlight-color: transparent` 触控高亮清除与安全内边距工具类；
    - **响应式双轨导航体系**：
      - **隐藏桌面侧栏**：在移动端视口（`< md`）下通过 `hidden md:flex` 隐藏 PC 端左侧竖向 `Sidebar`，把整个横屏空间完整释放给内容；
      - **移动端专属底部导航栏 (`MobileBottomNav`)**：常驻屏幕底部（今日、收集箱带未整理角标、中央快捷悬浮 FAB 按钮、日历、更多功能抽屉），自带安全底部内边距防手势条遮挡；
      - **快捷记录 FAB 弹层**：点击中间高亮 `＋` 按钮弹出极简 Action Sheet，可快捷唤出「闪念收集」或「任务速记」；
      - **更多抽屉**：轻触「更多」平滑升起底部面板，包含目标、统计、复盘、设置等二级导航；
    - **顶部状态栏沉浸式与 Header 响应式精简**：
      - 顶栏高度自适应加上状态栏高度 `h-[calc(3.25rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)]`，彻底解决截图中的顶栏被系统状态栏遮挡问题；
      - 移动端自动精简隐藏桌面挂件、`Ctrl+K` 桌面快捷键提示与冗长文字，折叠为小屏专属搜索图标，杜绝挤压换行；
    - **Android 原生能力增强 (`nativeService`)**：
      - 集成 `@capacitor/status-bar` 与 `@capacitor/app`；
      - 状态栏透明浮动在 Webview 上层，根据系统/用户主题自动同步状态栏文字明暗（深色/浅色）；
      - 监听 Android 物理返回键：优先关闭瞬时弹窗与浮层，根路由页面 2 秒内双击退出防误触；
    - **本地 Gradle 命令行编译体系**：
      - 写入 `android/local.properties` 绑定本地 SDK 路径（`sdk.dir=D:\\develop\\SDK`）；
      - 在 `package.json` 中配置快捷命令：`cap:build`, `android:debug`, `android:run`, `android:release`；
      - 执行 `.\gradlew.bat assembleDebug` 成功编译生成 `android/app/build/outputs/apk/debug/app-debug.apk` (4.6 MB)。

17. **Android 移动端弹窗与全屏抽屉重构、触控时间轴优化、Windows设置清理、局域网 WiFi 一键同步（方案 A）与品牌图标升级**：
    - **移动端全屏抽屉重构（彻底解决图 2 挤压）**：
      - 将日历排期抽屉 (`SidePlanningDrawer.tsx`)、任务属性检视面板 (`InspectorShell.tsx`) 以及时间分配洞察 (`AllocationDrawer.tsx`) 全部升级为响应式全屏覆盖抽屉：桌面端并排，移动端为 `fixed inset-0 z-50 w-full`，自带全屏遮罩、顶部状态栏安全避让与清晰的关闭返回按钮，彻底告别日历主界面被挤压变形；
    - **移动端弹窗 BottomSheet 重构（彻底解决图 1 遮挡）**：
      - 将时间块创建弹窗 (`InlineCreatePopover.tsx`)、任务详情弹窗 (`TaskDetailModal.tsx`)、智能排盒弹窗 (`AutoPackModal.tsx`) 等全部重构为移动端自底向上 BottomSheet，顶部带有移动端指示手柄条，底部操作按钮栏增加 `pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)]`，杜绝被底部导航栏或手势条遮挡；
    - **时间轴触屏轻触创建（Tap-to-Create）**：
      - 在 `TimelineView.tsx` 中增加单击/轻触时间槽智能判定，点击空白时段自动选取 30 分钟并唤起新建时间块弹窗，无需艰难拖拽；时间轴顶栏新增一键快捷「加时间块」按钮；
    - **Windows 专属功能在移动端自动过滤与清理**：
      - 在 `SettingsPage.tsx` 中针对移动端环境自动隐藏「桌面挂件」与「键盘快捷键」两项 Windows/桌面专属设置标签；
    - **局域网 WiFi 一键数据同步（方案 A 落地）**：
      - 创建 `lanSyncService.ts`，实现全量 Dexie 数据库导出与基于 `updatedAt` 时间戳的双向智能增量合并引擎（Last-Write-Wins，保证不丢数据）；
      - 创建 `LanSyncModal.tsx`，电脑端一键提供当前局域网连接地址，手机端输入 IP 或扫码一键秒级双向同步；
      - 在移动端「更多」抽屉与设置「数据与局域网同步」模块中均挂载一键同步入口；
    - **Android 品牌矢量自适应图标与 1.2.0 版本升级**：
      - 提取品牌标志创建 `ic_launcher_foreground.xml` 矢量图形，背景采用 `#1E1B4B`，自适应覆盖 `mipmap-anydpi-v26`；
      - `android/app/build.gradle` 全面对齐版本号为 `1.2.0`（`versionCode: 4`）；
18. **今日页面弹窗层级穿透修复 (Portal)、顶栏加号精简与全套电脑端品牌图标同步**：
    - **弹窗彻底脱离 Stacking Context**：
      - 深入定位并解决了今日页面因外层 `sticky` 容器形成的局部层叠上下文问题，在 `InlineCreatePopover.tsx`、`AutoPackModal.tsx`、`FocusFullModal.tsx` 以及 `TodayPage.tsx` 的今日聚焦弹窗中全面引入 React `createPortal` 挂载至 `document.body` 根节点，并设为 `z-[9999]`。弹窗与深色遮罩完全凌驾于全局之上，**底部导航栏彻底被遮罩覆盖在下方，底部 Sticky 操作栏（取消/创建）清晰完整可见**（彻底解决图 1、图 2）；
    - **顶栏加时间块快捷按钮移除**：
      - 根据用户反馈，精简删除 `TimelineView.tsx` 顶栏的「加时间块 (＋)」常设快捷按钮，保留触屏轻触（Tap）网格空白处 1 秒即选的便捷操作；
    - **APP 图标与电脑端 100% 像素级对齐**：
      - 编写 `scripts/generate_android_icons.ps1`，从电脑端 512x512 高清原图 `src-tauri/icons/icon.png` 批量生成全套 Android 规范分辨率位图（`mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi` 下的 `ic_launcher.png`、`ic_launcher_round.png`、`ic_launcher_foreground.png`），并同步 `mipmap-anydpi-v26` 配置；
      - 彻底消除应用安装器（如小米安装界面图 3）读取到原生默认 Android 机器人图标的问题，实现电脑端与手机端品牌视觉完全统一；
19. **彻底修复清空后重启重复注入演示数据问题、完善局域网真实 HTTP 同步服务与输入交互**：
    - **彻底修复演示数据重启反复注入 bug**：
      - 排查发现 `App.tsx` 原逻辑中仅以 `db.tasks.count() === 0` 判断是否新用户，导致用户在设置中清空数据后每次重启又自动执行 `seedDemoData`；改为增加 `localStorage.getItem('tilo_has_initialized_seed')` 标记，确保只有全新的首次安装才会执行演示数据注入，用户清空数据后重启绝对保持干净空白；
    - **Rust 端内建极简高并发局域网 HTTP 同步服务 (端口 27123)**：
      - 在 `src-tauri/src/lib.rs` 中使用 Rust 标准库纯净实现 HTTP 服务端，自动处理所有跨域预检请求（CORS OPTIONS 204），并实现 `POST /api/sync/merge` 接口；
      - 电脑端打开时自动导出 Dexie 数据缓存到 Rust 内存中，当手机请求时秒级返回电脑端数据，同时通过 Tauri 事件通知电脑端前端将手机数据实时合入电脑端 Dexie；
    - **手机端输入体验优化与错误即时清空**：
      - 在 `LanSyncModal.tsx` 中绑定 `onChange` 实时清空原有 `errorMessage`，支持回车直接触发同步，并自动智能格式化 IP 与端口；
    - **两端全量构建成功**：
      - Windows 客户端（`app.exe`, `Tilo_1.2.0_x64-setup.exe`）与 Android 客户端（`app-debug.apk`）全部完成最终重新打包。

20. **解决 Android 明文 HTTP 通信限制 (usesCleartextTraffic) 与双向二维码/快传口令同步方案**：
    - **解除 Android 局域网 HTTP 拦截**：
      - 排查确定截图中的 `Failed to fetch` 根因：Android 9+ (API 28+) 默认强制阻断 WebView 向内网 `http://` 端口发起的明文请求；在 `android/app/src/main/AndroidManifest.xml` 中追加 `android:usesCleartextTraffic="true"`，彻底放行局域网端口通信；
    - **双向二维码配对与快传口令同步 (QR & Sync Code)**：
      - 集成轻量 `qrcode` 库，在 `LanSyncModal.tsx` 中新增子选项卡「二维码与快传口令」；
      - **电脑端**：自动渲染局域网配对二维码，手机可一扫直达；同时支持「导出快传口令（Sync Code）」，无论何种网络环境，复制粘贴即可瞬间完成双向增量合并；
      - **手机端**：支持一键「读取剪贴板并合并」口令，也可以生成手机端二维码/口令供电脑合并，实现两端 100% 互相同步；
    - **双端最新产物生成**：
      - Windows: `app.exe` (9.59 MB), `Tilo_1.2.0_x64-setup.exe` (2.30 MB)
      - Android: `app-debug.apk` (5.99 MB)

21. **手机端直接调用摄像头扫码、电脑端高清大二维码与废除冗长口令**：
    - **废除万字冗长口令，改为极简短地址配对**：
      - 针对口令过长的体验问题，彻底移除将整个 Dexie 序列化为几万字 Base64 的旧逻辑；配对二维码内容改为标准的极简局域网通信地址（如 `http://192.168.0.105:27123`），二维码图案大而清晰，极易识别；
    - **手机端一键调用相机扫码 (`html5-qrcode`)**：
      - 在 `AndroidManifest.xml` 中配置 Android 原生相机权限（`CAMERA` 与 `autofocus`）；
      - 手机端界面核心呈现醒目的「📷 开启相机扫一扫」主按钮；点击直接在弹窗内呼出摄像头实时取景器，对准电脑屏幕二维码；
      - 扫到的瞬间自动识别提取电脑端 IP，立即停止取景，**并自动触发双向增量合并**，全程完全无需用户手动敲键盘或输任何数字；
    - **双端最终构建完成**：
      - Windows: `app.exe` (9.68 MB), `Tilo_1.2.0_x64-setup.exe` (2.39 MB)
      - Android: `app-debug.apk` (5.64 MB)

22. **彻底解决 HTTP 服务请求阻塞、今日聚焦多层文本遮挡、时间轴信息充分呈现、收集箱 Tab 截断与全局触屏适配**：
    - **修复 Rust HTTP 同步服务阻塞 Bug (彻底解决 Failed to fetch)**：
      - 排查定位出 `src-tauri/src/lib.rs` 中在读取到 `\r\n\r\n` 请求头结束标志后缺失了 `break`，导致服务端一直等待后续流输入直到 10 秒超时；加上 `break` 并在响应头追加 `Connection: close`，局域网 HTTP 接口在毫秒级极速响应；
    - **重构今日聚焦卡片 (彻底解决图 2 文本遮挡重叠)**：
      - 彻底重构 `DailyFocusSection.tsx` 为响应式分层结构，首行容纳序号、完整任务标题（`line-clamp-2`）与专注大按钮，次行排布项目、标签与排期时间，彻底根除时间文本盖在任务标题之上的混乱层叠；
      - `NextUpSection.tsx` 中移除无日期时的无意义占位符，释放标题宽度；
    - **时间轴卡片立体排版 (彻底解决图 3 标题被压成“第..”)**：
      - 重构 `TimelineView.tsx` 时间块卡片布局：顶部仅放轻量 Badge 与微型重叠警告角标，中间整块完整展示任务名称（`line-clamp-2` 并支持换行），底部展示时间；实际（Actual）会话块清晰显示任务标题，彻底消除大片空白与截断；
    - **收集箱分类 Tab 栏防截断 (彻底解决图 4 挡在屏幕外)**：
      - 将 `InboxPage.tsx` 中的 Tab 容器升级为 `overflow-x-auto scrollbar-none flex-nowrap shrink-0`，使「已归档」等所有标签在小屏下能够平滑自适应横向滚动查看，绝不再被右侧视口边缘截断；
    - **全系统触屏适配（解决原来只有鼠标 hover 才能看到的按钮）**：
      - 在 `src/index.css` 中增加全局 `@media (hover: none) and (pointer: coarse)` 适配规则，触屏设备上原本依赖 hover 的操作按钮（如快速开启专注、删除、拖拽排序、状态切换）自动常驻显示为半透明/可用状态；
      - 在 `DailyFocusSection`、`NextUpSection`、`InboxPage`、`TimelineView` 等关键卡片上统一切换为 `sm:opacity-0 sm:group-hover:opacity-100 opacity-80`，手机端触手可及。

## 3. TypeScript / ESLint / tests / build

- **TypeScript** (`npm run typecheck`): Passed (0 errors)
- **ESLint** (`npm run lint`): Passed (0 errors)
- **Tests** (`npm run test`): Passed (43/43 test files passing, 130/130 tests passing)
- **Vite Web Build** (`npm run build`): Passed (0 errors)
- **Android Gradle Build** (`npm run android:debug`): **Passed (Exit code 0, 57s)**，生成最新 `android/app/build/outputs/apk/debug/app-debug.apk` (6.22 MB)
- **Tauri Desktop Build** (`npm run tauri:build`): **Passed (Exit code 0, 1m53s)**，更新 `Tilo_1.2.0_x64-setup.exe` (2.40 MB) 与绿色免安装 `app.exe` (9.69 MB)

## 4. Known issues

- None.

## 5. Next task

- 用户实机体验移动端全新今日聚焦卡片、清晰时间轴、可滑动收集箱标签以及丝滑的局域网/扫码同步。

---

## Phase 28 扩展 — 双端对称同步 + 自动同步（本次会话）

> 用户要求：1) 电脑也要能主动和手机同步（原只有手机连电脑）；2) 自动检测对端可达后自动合并。已确认采用「双端都做同步服务器」方案。

### 1. Files changed (双端对称同步)

- `android/app/src/main/java/com/tilo/app/SyncServer.java` — **[NEW]** 轻量 `ServerSocket` HTTP 同步服务，监听 `0.0.0.0:27123`，**镜像桌面 Rust 服务**：POST `/api/sync/merge` 时把对方载荷经 `evaluateJavascript("window.__tiloSyncOnReceive(<json>)")` 转发给 WebView 合并，并回传本机缓存载荷；暴露 `window.__tiloSyncServer.setPayload/getLocalIp`（`addJavascriptInterface`）；`getLocalIpAddress()` 取 Wi-Fi 物理 IPv4。所有响应带 `Access-Control-Allow-Origin: *`。
- `android/app/src/main/java/com/tilo/app/MainActivity.java` — **[UPDATED]** onCreate 创建 `SyncServer`，onResume 绑定 `bridge.getWebView()` + JS 接口并启动服务（防重复 attach），onDestroy 停止。
- `src-tauri/src/lib.rs` — **[UPDATED]** `/api/sync/merge` 处理时额外 `emit("lan-sync-peer", peer_ip)`（取 `stream.peer_addr()`），让桌面记住手机为已知对端，实现电脑主动/自动回连。
- `src/services/syncManager.ts` — **[NEW]** 双端局域网自动同步管理器：维护已知对端 IP、自动开关、在线/离线状态；`init()` 手机端注册 `__tiloSyncOnReceive`、桌面端监听 tauri `lan-sync-received`/`lan-sync-peer`；每 15s `refreshOwnPayload` + 探测已知对端可达即双向合并；`refreshOwnPayload` 桌面走 `invoke('update_desktop_sync_payload')`、手机走 JS bridge `setPayload`。`addPeer/removePeer/setAuto/syncPeer/syncAll` 供 UI 调用；`subscribe` 供 UI 实时刷新。
- `src/App.tsx` — **[UPDATED]** 移除旧的 `lan-sync-received` 内联合并逻辑，改为顶部统一调用 `syncManager.init()`（全平台启动，内部按平台适配），首次导出本机载荷。
- `src/components/sync/LanSyncModal.tsx` — **[UPDATED]** 双端加「自动同步」开关、已知设备列表（状态点 + 单设备同步/移除）、电脑端「手机地址 + 连接并同步」输入、手机端「本机地址二维码」（供电脑扫码主动连手机）、底部电脑端「立即同步所有设备」按钮。

### 2. Features completed (双端对称同步)

1. **电脑可主动与手机同步**：手机端新增原生同步服务后，电脑输入手机 IP 即可主动发起双向合并（不再只有手机扫电脑二维码一种方向）。
2. **自动检测 + 自动同步**：`SyncManager` 每 15s 刷新本机载荷并探测已知对端，可达即自动双向合并；首次连接后双端互记对方 IP，之后打开任一端即自动互相同步。
3. **已知设备持久化**：对端 IP 存入 localStorage，跨会话保留；桌面通过 `lan-sync-peer` 自动 learned 手机 IP。
4. **双端可扫码互连**：手机端弹窗展示本机地址二维码，电脑端扫码即可主动连手机。

### 3. TypeScript / ESLint / tests / build (双端对称同步)

- `npm run typecheck` — Passed (0 errors).
- `npm run lint` — Passed (0 errors).
- `npm run test` — Passed (130/130；原 smoke 测试因新增 `useEffect` 引用 `localSuggestedIp` 早于其声明导致 TDZ 报错，已将 effect 移至声明之后修复).
- `npm run build` (Vite web) — Passed.
- `npx cap copy android` + `gradlew assembleDebug --offline` — **BUILD SUCCESSFUL**，产物 `android/app/build/outputs/apk/debug/app-debug.apk` (5.2 MB, 2026-10-19 13:03)。首次编译因 `JavascriptInterface` 误 import 自 `androidx.annotation`（应为 `android.webkit`）失败，修正后通过。
- 全局 Gradle 代理文件 `C:\Users\hhgg\.gradle\gradle.properties` 已恢复为原启用状态。

### 4. Known issues (双端对称同步)

- 手机 App 完全退到后台/锁屏后，Android 可能回收其同步服务（系统 Doze/电池优化），此时电脑无法主动拉取手机；手机 App 一打开即自动回连并双向同步（属 Android 平台限制，非缺陷）。
- 纯 Web 端（浏览器）不运行同步服务，仅桌面(Tauri)/手机(Capacitor) 参与。

### 5. Next task (双端对称同步)

- 真机验证：电脑输入手机 IP 能否主动同步；双端同开是否自动互相同步；手机弹窗本机二维码能否被电脑扫码连接。
- 验证通过后可提交推送（git 提交信息纯英文）。

### 6. Fix — 同步提示刷屏 & 桌面同步失效（2026-10-19 14:58）

**现象**：桌面右侧持续堆积「已收到手机端数据并自动合并！(更新: 0项, 新增: 0项)」提示，清不完；同时电脑端同步实际未生效。

**根因与修复**：
1. **提示刷屏**：`LanSyncModal` 在 `isOpen` 的 effect 内重复注册 `listen('lan-sync-received')` 且**没有 cleanup**——每打开一次弹窗就多叠一个监听器；手机自动同步每 15s 推一次，每个监听器都无条件 toast（即使 0 变更）。已删除该重复监听，合并统一由 `syncManager` 单例处理。
2. **提示策略**：`syncManager.handleIncomingRemote` 改为仅在 `updatedCount + addedCount > 0` 时提示，且 10s 节流；对端无新数据时完全静默。
3. **桌面合并失败**：手机原生服务 `cachedPayload` 未就绪时返回 `{}`（旧实现甚至可能为 `null`），桌面 `mergeRemotePayload` 访问 `remote.data` 抛错 → 整次同步失败并标记对端 offline。已加防御（无 `data` 直接返回 0 变更）并让原生服务默认载荷为结构合法的空载荷。
4. **往返放大**：`addPeer` 原先每次 `lan-sync-peer` 事件都立即 `syncPeer`，手机每推一次桌面就反向再推一次。改为仅「首次发现对端」时立即同步，其余交给 15s 自动轮询。
5. `addPeer` 兼容 Rust 端传字符串或 `{ ip }` 对象两种载荷。

**验证**：`typecheck` / `lint` / `test`(130/130) 全过；重打桌面 MSI(14:56)/NSIS(14:57) 与 APK(14:58)。

**注意**：**必须重装本次桌面安装包与 APK**，旧桌面进程不包含 `syncManager` 与 `lan-sync-peer`，仅靠旧包无法实现电脑主动同步。

### 7. Fix — 反向同步（手机→电脑）失效（2026-10-19 15:32）

**现象**：电脑改任务 → 手机能看到；手机改任务 → 电脑收不到。

**根因**：
1. **手机端从未把电脑 IP 登记为自动同步对端**。扫码/手动同步走的 `executeSync` 直接调用 `lanSyncService.syncWithHost`，绕过了 `syncManager`；而 `syncManager` 只在收到 Tauri `lan-sync-peer` 事件时 `addPeer`，该事件仅桌面端存在。结果手机端 `knownPeers` 为空 → 自动同步只能由电脑单向发起。
2. 手机原生服务此前把完整 JSON 直接拼进 `evaluateJavascript`，大载荷有被丢弃风险；`cachedPayload` 初始结构不完整时电脑也拿不到手机数据。

**修复**：
- 新增 `syncManager.rememberPeer()`（只登记、不立即同步）；`executeSync` 成功后登记对端；手机端启动时把 `tilo_last_lan_sync_ip`（上次手动/扫码的电脑地址）迁移登记为自动同步对端。
- 手机原生服务新增 `window.__tiloSyncOnPeer(ip)`：电脑主动推送时，手机据此自动记住电脑 IP —— 即使从未扫码也能自愈配对。
- `SyncServer` 改为「Java 暂存 + JS 通过 `consumePendingPayload()` 取走」，避免大数据塞进 `evaluateJavascript`；`MainActivity` 在 `onCreate` 即注入 JS 桥，不再只依赖 `onResume`。
- `refreshOwnPayload` 在桥缺失时输出明确警告，便于后续排查。

**验证**：`typecheck` / `lint` / `test`(130/130) 全过；桌面 MSI/NSIS 15:31、APK 15:32。

### 8. 产品与体验审计（2026-10-21，仅文档，无代码改动）

- 产出 `docs/audit/PRODUCT_UX_AUDIT_2026-10.md`：市场对照（Sunsama / Motion / Reclaim / Structured / Akiflow / Morgen）、差异化评估、UX 审计（IA / 旅程 / 一致性 / 可访问性 / 性能 / 首启）、P0–P2 改动方案、版本节奏建议、明确不做清单。
- 关键结论（供下一会话直接接手）：
  1. 最高杠杆问题是** Analytics 页无空态、无指标解读、无入口引导**——新用户感知不到「计划 vs 实际」这一核心差异。
  2. **一致性债务到临界点**：28 个手写弹窗壳、3 套并行反馈机制、z-index 四种取值、约 30 个 div+onClick 缺 role/tabIndex，全局 `:focus-visible` 缺失（违反 AGENTS.md 第 10 条）。
  3. **IA 缺 `/tasks` 与 `/projects` 索引路由**，削弱「审查自己的承诺」这一核心动作。
  4. **零 onboarding**，且演示数据首次启动静默注入、空态无 CTA。
  5. 差异化护城河：计划准确度复合指标、不可变复盘修订、本地优先（可对标 Clockwise 2026-03 关停事件）、强约束领域模型。
- 建议下一步（v1.4 主题「让差异被看见」）：首启引导 + 演示数据明示 → Analytics 页讲人话 → 补 `/tasks` 与 `/projects`。
