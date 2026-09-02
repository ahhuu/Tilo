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
- [x] Phase 26 — Tauri v2 Desktop Native App & Multi-Window Desktop Widget

---

## 1. Files changed

- `package.json` — **[UPDATED]** Added `@tauri-apps/api` and `@tauri-apps/cli` dependencies, added `tauri:dev` and `tauri:build` scripts.
- `eslint.config.js` — **[UPDATED]** Added `src-tauri` to ignore list to prevent linting Rust compilation artifacts.
- `src-tauri/Cargo.toml` — **[NEW]** Rust crate definition with Tauri v2 dependencies.
- `src-tauri/tauri.conf.json` — **[NEW]** Configured `main` and `widget` native windows with transparency, shadow, and resizability.
- `src-tauri/capabilities/default.json` — **[UPDATED]** Granted multi-window permissions for `main`, `widget`, and dynamic `widget-*` windows.
- `src-tauri/src/lib.rs` & `src-tauri/src/main.rs` — **[NEW]** Tauri Rust runtime bootstrap.
- `src/services/tauriWidgetService.ts` — **[UPDATED]** Re-architected for multi-widget standalone window lifecycle management: `openWidget`, `closeWidget`, `toggleWidget`, `isWidgetVisible`, `openDualDefaultWidgets`, and `closeAllWidgets`.
- `src/components/widget/StandaloneWidgetShell.tsx` — **[NEW]** Elegant standalone widget container shell with perfectly symmetric `rounded-2xl` corners, frosted acrylic glass styling, and `data-tauri-drag-region` mouse dragging.
- `src/pages/SingleWidgetPage.tsx` — **[NEW]** Route handler loading individual standalone widgets via `/widget/:gridId`.
- `src/components/widget/WidgetLauncherPopover.tsx` — **[NEW]** Desktop widget control center dropdown allowing users to toggle any core widget on/off or launch dual widgets with 1 click.
- `src/components/widget/grids/InboxGrid.tsx` — **[UPDATED]** Refactored outer container to fill standalone shell flexibly with no nested border and zero corner cut-offs.
- `src/components/widget/grids/TasksGrid.tsx` — **[UPDATED]** Refactored outer container to fill standalone shell flexibly with infinite vertical/horizontal resize support.
- `src/components/widget/grids/SessionGrid.tsx` — **[UPDATED]** Refactored outer container to adaptively fit custom window dimensions.
- `src/components/widget/grids/TimelineGrid.tsx` — **[UPDATED]** Refactored outer container to adaptively fit custom window dimensions.
- `src/components/widget/grids/NotesGrid.tsx` — **[UPDATED]** Refactored outer container to adaptively fit custom window dimensions.
- `src/components/layout/Header.tsx` — **[UPDATED]** Replaced simple launcher button with the `WidgetLauncherPopover` interactive control center.
- `src/App.tsx` — **[UPDATED]** Registered dynamic `/widget/:gridId` standalone route.
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

## 3. TypeScript / ESLint / tests / build

- **TypeScript** (`npm run typecheck`): Passed (0 errors)
- **ESLint** (`npm run lint`): Passed (0 errors)
- **Tests** (`npm run test`): Passed (43/43 test files passing, 7/7 in widgetFeatures)
- **Vite Web Build** (`npm run build`): Passed (0 errors)
- **Tauri Desktop Build** (`npm run tauri:build`): **Passed (Exit code 0)**，成功生成 `Tilo_1.2.0_x64-setup.exe` 与最新绿色免安装 `app.exe`。

## 4. Known issues

- None.

## 5. Next task

- 执行 `git add`、`git commit` 并推送至远程仓库 `origin/master`。
