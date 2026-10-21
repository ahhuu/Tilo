# Tilo v1.5.1 Release Notes

> Version: `1.5.1`
> Date: 2026-10-22
> Codename: **Guard rails（护栏）**

v1.5.1 不加功能，只还 v1.5.0 留下的三笔债。三条都属于「会重复咬人」或「用户能直接感知」的缺陷，因此单独立版而不是攒到 v1.6。

---

## 1. 🛡️ 静态检查固化（最重要的一条）

v1.5.0 花了不少时间修 6 个缺陷：4 个文件多一个 `</div>`（esbuild 构建时才报）、2 个文件用了 `<Modal>` 但漏了 import（**打开即白屏**）。这些 `tsc` 全程沉默，当时靠一个临时脚本发现，用完删了——也就是说下次加弹窗还会踩同一个坑。

现在固化为常设检查：

```bash
npm run check:jsx    # 单独跑
npm run verify       # typecheck + lint + check:jsx + test 一条龙
```

`scripts/check-jsx.mjs` 做两件事：

1. 用 esbuild 逐文件 `transform` 全部 198 个 `.tsx`/`.ts`，抓标签不平衡（`tsc` 不做这个校验）；
2. 审计所有使用 `<Modal` 的文件是否真的 `import Modal`。

**这条检查已用故意写错的探针验证过确实会失败**（而不是又一个假绿）。对多余 `</div>` 这类错误还追加了人话提示，避免以后有人看到报错不知道怎么修。

---

## 2. 🎯 Modal 焦点管理修复

两个 v1.5.0 遗留的真实缺陷：

**焦点陷阱可被脱离。** `keydown` 监听原本挂在弹窗卡片上，一旦焦点落到 `<body>`（点遮罩、或当前聚焦元素被卸载），Tab 就不再受陷阱控制，会跑到弹窗背后的页面上。现在：

- 键盘监听移到 `document` 的捕获阶段；
- 增加 `focusin` 兜底，任何跑到弹窗外的焦点都会被拉回内部；
- Tab 时若焦点已在弹窗外，回到首/末可聚焦元素。

**嵌套弹窗一次 Esc 关两层。** 监听移到 `document` 后，外层弹窗也会收到事件。现在通过 React 上下文传递嵌套深度，**只有最深一层响应** `Escape` / `Tab`。

> 技术注记：这里没有用「挂载栈」判断层级，因为 React effect 是**子先父后**执行，同时渲染的嵌套弹窗用栈会判反；也没有用 DOM 顺序，因为 portal 的插入顺序同样不可靠。上下文传深度是唯一稳的方式。

---

## 3. 📱 Android 返回键不再静默无响应

`ContinuousProcessingModal`（连续整理模式）传了 `dismissable={false}`——它故意不允许点遮罩关闭，避免误触丢失处理进度。副作用是：遮罩上没有 `onClick`，而 `nativeService.dismissTopOverlay()` 的机制是**向遮罩派发合成 click**。于是返回键被 `return true` 吃掉了，但弹窗没有任何反应——用户体感是「返回键坏了」。

修复：

- `Modal` 新增 `onBack` 回调，在 `dismissable=false` 时由遮罩 click 触发；
- `ContinuousProcessingModal` 传 `onBack={onClose}`，返回键等同右上角关闭；
- 顺带修掉了遮罩 click 的一个隐患：增加 `e.target === e.currentTarget` 判定，点击弹窗内容区不会再误关（此前依赖内容区自己 `stopPropagation`）。

---

## 4. 🧪 回归测试：从零覆盖到 11 条

这些缺陷能进发布版本的根本原因是 **`Modal` 一条测试都没有**。本次新增 `src/test/modalShell.test.tsx`（11 个用例）：

| 覆盖点 | 验证内容 |
|---|---|
| 焦点陷阱 | Tab 在首/末元素间循环，不会跑到弹窗外 |
| 焦点脱离兜底 | 焦点被移到 `body` 后，`focusin` 会把它拉回 |
| 嵌套 Esc 隔离 | 两层弹窗同时打开，一次 Esc 只关内层 |
| 焦点归还 | 关闭后焦点回到打开前的触发元素 |
| 返回键 | `dismissable=false` 时遮罩合成 click 触发 `onBack`，而不只是吞掉事件 |
| 遮罩点击 | 点内容区不关，点遮罩才关 |

**每条测试都用「把修复改回去 → 测试失败」验证过**，确保不是摆设。

---

## 📦 Build & Verification

- `npm run verify` — Passed（typecheck 0 error / lint 0 error + 6 条既有 warning / check:jsx 通过 198 文件 / vitest **44 文件 141 用例全绿**）
- `npm run build`（Vite web）— Passed（首包 1860.73 kB / gzip 509.82 kB）
- 桌面 `npm run tauri build` — **BUILD SUCCESSFUL**（3m21s）：`Tilo_1.5.1_x64_en-US.msi`（3.27 MB）、`Tilo_1.5.1_x64-setup.exe`（2.31 MB）
- Android `npx cap copy android` + `gradlew assembleDebug --offline` — **BUILD SUCCESSFUL**（1m11s）：`app-debug.apk`（4.71 MB，versionName `1.5.1` / versionCode `9`）
- 版本号：`package.json` / `package-lock.json` / `src-tauri/tauri.conf.json` = `1.5.1`；`android/app/build.gradle` = versionName `1.5.1` / versionCode `9`；`src-tauri/Cargo.toml` 按项目惯例保持 `0.1.0`

### 仍待处理（v1.6 范围）

- 首包 1860 kB，仍无路由级 code splitting
- `AnalyticsPage` / `CalendarPage` 全表 `toArray()`，无日期范围查询
- widget 模块 484 处硬编码中文
- Android 返回键机制仍依赖 class + computed z-index + 合成事件探测（未改为显式栈管理）
