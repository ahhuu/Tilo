# Tilo v1.6.0 Release Notes

> Version: `1.6.0`
> Date: 2026-10-22
> Codename: **Load less, own less（少加载，少背负）**

v1.6.0 不加功能。它处理三类从 V1 起就在持续累积的成本：**首屏把整个路由树和 11 个用不到的 UI 库一起打包**、**五个组件长到了 700~1300 行**，以及**删除操作根本没有参与同步**（一端删了，另一端会把它推回来）。

一句话结果：首屏体积 **减少 60%**，仓库内最大的组件从 1325 行降到 94 行，且全仓库不再有超过约 680 行的组件；删除在两端都能落地，不再复活。

---

## 1. 🪶 首屏从 1860 kB 降到 736 kB

### 做了什么

- 11 个页面改为 `React.lazy` 路由级懒加载；
- `Suspense` 边界放在 `AppLayout` 外层——只放一次，切页时不会每次都闪一下 fallback；
- `/widget/:gridId` 单独一个静默边界（`fallback={null}`），避免挂件窗口出现占位闪烁；
- `LanSyncModal` 改为 **lazy + 仅在打开时挂载**。

### 为什么 LanSyncModal 是关键

它单独成 chunk 后是 **380.82 kB**（gzip 117.05 kB）——也就是说在此之前，它几乎是首屏体积的四分之一。原因是 `MobileBottomNav` 静态引用了它，而它又静态引用了 `html5-qrcode`（扫码库）。

```
修复前  index.js                 1860.73 kB │ gzip 509.82 kB
修复后  index.js                  736.29 kB │ gzip 221.10 kB
        LanSyncModal.js           380.82 kB │ gzip 117.05 kB   ← 按需加载
```

### 顺带清掉 11 个零引用依赖

| 依赖 | 说明 |
|---|---|
| `recharts` | 图表早已换成手写 SVG |
| `motion` | 9 处「引用」实际是 Tailwind 的 `motion-reduce:` 变体，库里一次都没用 |
| `react-hook-form` | 全部表单是受控组件 |
| 8 个 `@radix-ui/*` | checkbox / dialog / dropdown-menu / popover / select / slot / switch / tabs |
| 保留 | `@radix-ui/react-tooltip` 仍在使用 |

> 顺手留下的教训：`grep motion` 会把 `motion-reduce:`、`motion-safe:` 全数命中，判断依赖是否真被引用要看 import，不是看字符串。

---

## 2. 🗂️ 五个巨型组件拆分

不改任何用户可见行为，导出签名一律保持不变。拆完的结构按职责命名，不再有「什么都干的 Shell」。

| 组件 | 拆分前 | 拆分后 | 拆出的部分 |
|---|---|---|---|
| `StandaloneWidgetShell` | 1325 | **94** | 顶栏 / 配置抽屉 / 6 个挂件专属面板 / 窗口行为 hook / 外观样式表 |
| `TimelineView` | 1057 | **406** | 页头 / 时间块（含徽标、快捷动作、幽灵延伸）/ 后台轨道 / 指针手势 hook |
| `InboxPage` | 857 | **196** | 数据 hook / 动作 hook / 笔记 hook / 页头 / Tab 栏 / 条目行 / 列表 / 笔记列表 |
| `LanSyncModal` | 755 | **173** | 局域网会话 hook / 电脑配对面板 / 手机扫码面板 / 对端管理区 |
| `WidgetSettingsSection` | 727 | **36** | 4 个区块 + 共享控件 + 挂件状态 context |

### 拆分中顺手修掉的两个真问题

1. **设置页重复 invoke IPC**：桌面挂件状态（开机自启 / 自动唤起 / 可见挂件）原本被三个区块各自拉取一次，现在收进一个 context，挂载时只取一次。
2. **窗口质感说明在英文界面仍是中文**：`descZh` 被无条件渲染，现已补上 `descEn`。

### 拆分守住的边界

- 所有交互逻辑（拖拽框选、触屏长按、resize 把手、双击折叠、跨挂件对齐导引线）逐字搬迁，没有「顺手优化」；
- 拆分后跑一次 `vite build` 确认首包字节数与拆分前**完全一致**（736.29 kB），证明只搬了代码、没搬进新逻辑。

---

## 3. 🔍 查询范围化与记忆化

`AnalyticsPage` 与 `GoalsPage` 原本把 `plannedBlocks` / `activityEvents` 整表 `toArray()` 拉到内存再过滤。现在：

- 走 `.where('startAt').between(...)` / `.where('occurredAt').between(...)` 的时间索引；
- `computeAnalytics` 与目标聚合进 `useMemo`；
- 依赖数组里的 `|| []` 换成模块级 `EMPTY_ARRAY` 常量——否则每次渲染都是新数组，`useMemo` 等于没写。

> 有意只做安全的一半：`sessions` 保留全表读取。`analyticsService` 的准确率估算需要跨周期的全量时长，裁掉会算出错误的估计值。

---

## 4. 🌐 挂件界面双语收口

`WidgetSettingsModal`、`DesktopWidgetContainer`、`InAppWidgetWorkspace`、`InAppWidgetShell` 四个文件不再硬编码中文，统一走 `isZh` / `L(zh, en)` 助手；选项数组从 `{ id, label }` 改为 `{ id, zh, en }`。

---

## 5. 🧪 回归测试

新增 `src/test/timelineView.test.tsx`（7 条）。时间轴是本次拆分里交互最密的一块，必须锁住契约：

| 覆盖点 | 验证内容 |
|---|---|
| 两种卡片高度分支 | ≤35 分钟走单行、更长走两行，区块与时间都正确渲染 |
| 键盘可达性 | 计划块 `role="button"` + `tabIndex=0` |
| 方向键改期 | `↓` 位移 15 分钟且**时长不变**；`Shift+↑` 位移 1 小时 |
| 删除 | `Delete` 触发 `onDeletePlannedBlock` |
| 过滤 | 「仅实际」隐藏计划块，「全部」恢复 |
| 空态 / 后台轨道 | 无条目显示引导文案；有后台会话时渲染右侧轨道 |

**已验证测试有效**：把 `STEP` 从 15 分钟改成 30 分钟后，改期用例立刻失败。

`db.test.ts` 追加范围查询用例，确认新索引读法与原先整表扫描返回同一批行。

---

## 6. ♻️ 删除终于能同步了（墓碑机制）

### 症状

手机上删掉的东西，电脑上还在；过十几秒，手机上又冒回来了。任何一类实体都可能出现，收件箱与笔记最常见。

### 根因：合并算法看不见「删除」

局域网同步是「整包 + `updatedAt` 谁大听谁的」。这套规则只能比较**同一条记录**谁的版本更新，无法从「对端没有这条记录」推断「对端把它删了」——因为本地可能只是还没收到过它。于是对端一旦手里有旧副本，合并时就会被当成「本地缺少」重新写回来。

在此之上还有两个具体缺陷，让问题更容易出现：

1. **硬删除根本没有留下任何痕迹**：时间块、专注会话（含分段）、模板删除时直接从表里 `delete`，载荷里既没有记录也没有删除信息，对端完全无法得知。
2. **软删除忘记推进 `updatedAt`**：收件箱、笔记、里程碑有 6 处直接写 `{ deletedAt: Date.now() }`。墓碑行的 `updatedAt` 还停在删除之前，合并时输给对端那份「未删除」的旧副本 —— 时间戳打平，本地版被忽略，删除永远传不出去。

### 修法：让「删除」本身成为一条可同步的事实

新增 **墓碑表** `syncTombstones`（Dexie schema 升到 version 2，主键 `table:entityId`，字段 `deletedAt`）：

- **硬删除 → 删除记录 + 写墓碑**（`hardDeleteWithTombstone`）。继承原有语义，不把时间块 / 会话 / 模板塞进废纸篓，因此几十处读取点一行都不用改。
- **软删除 → 统一走 `softDeleteRow`**，同时推进 `updatedAt`；恢复走 `restoreSoftDeletedRow`，同样推进 `updatedAt`，让「恢复」也能合法地压过删除。
- **合并时先并墓碑、再按墓碑删、最后合并数据**，并加了三道判定：
  1. 本地没有、但已被墓碑标记且对端这份不更新 → **不写回**（防复活）；
  2. 时间戳打平时**删除方胜出**（兼容修复前遗留的坏数据）；
  3. 对端记录的 `updatedAt` 比墓碑更新 → 保留（说明删除之后对端又显式重建/改过它）。
- **墓碑时间表随载荷传输**（`payload.tombstones`），旧版本对端不认识这个字段会直接忽略，不会报错。
- **防膨胀**：墓碑保留 180 天，之后在启动时清理；同步提示改为「更新 X 项，新增 Y 项，删除 Z 项」，删除不再是静默行为。
- **重置 / 恢复备份**会清空墓碑：否则旧墓碑会把刚恢复回来的数据再删一遍。

### 覆盖了哪些删除入口

| 实体 | 删除方式 | 修前 | 修后 |
|---|---|---|---|
| 任务 / 项目 / 目标 | 软删除（废纸篓） | ✅ 正常 | 不变 |
| 收件箱条目 | 软删除 | ❌ 漏 `updatedAt` | `softDeleteRow` |
| 笔记 | 软删除 | ❌ 漏 `updatedAt` | `softDeleteRow` |
| 里程碑 | 软删除 | ❌ 漏 `updatedAt` | `softDeleteRow` |
| 时间块（含重复系列、自动排程撤回） | 硬删除 | ❌ 无墓碑 | 墓碑 |
| 专注会话 + 分段 | 硬删除 | ❌ 无墓碑 | 墓碑 |
| 任务模板 | 硬删除 | ❌ 无墓碑 | 墓碑 |

> 顺带修掉一个同源缺陷：`SessionSegment` 没有 `updatedAt`，合并时两边都算 `0`，永远「本地优先」——会话结束时间同步不过去，两端的专注时长会对不上。现在比较时会退化到 `endAt`/`startAt`。

### 回归测试

新增 `src/test/syncDeletion.test.ts`（13 条），用两个独立的 Dexie 库模拟两台设备互相推载荷：

| 覆盖点 | 验证内容 |
|---|---|
| 软删除传播 | 对端副本在删除前被编辑过（`updatedAt` 更新）也压得住 |
| 坏数据兜底 | 历史数据删除时没推进 `updatedAt`，靠「打平即删除」仍能传播 |
| 硬删除传播 | 时间块删除后对端也删掉，且双方都留有墓碑 |
| 会话 + 分段 | 删会话会连分段一起墓碑化，两端都不残留 |
| 模板 | 模板删除同样靠墓碑传播 |
| 对端未知情 | 对端把旧副本推过来时**不会被写回**（`addedCount === 0`） |
| 删除后重建 | 对端显式重建（`updatedAt` 晚于墓碑）会被保留，墓碑不吞掉新写入 |
| 载荷 | 墓碑确实出现在 `exportFullPayload()` 里 |
| 分段时长 | 无 `updatedAt` 的分段靠 `endAt` 判断新旧，专注时长能同步 |
| 撤销删除 | 从废纸篓恢复同样推进 `updatedAt`，两端都回到未删除 |
| 双删一致 | 两边都已删除且时间戳相同时不做无谓写入 |
| 墓碑清理 | 过期墓碑被清理，未过期的保留 |
| 正常同步 | 未删除数据仍按 LWW 双向合并（确认修删除没有弄坏合并） |

**已验证测试有效**（三次反向探针，改回去都会挂）：去掉 `softDeleteRow` 里的 `updatedAt` 推进 → 「软删除传播」失败；去掉「打平即删除」→ 「坏数据兜底」失败；去掉「墓碑后不再写回」→ 「对端未知情」失败。

---

## 📦 Build & Verification

- `npm run verify` — Passed（typecheck 0 error / lint 0 error + 6 条既有 warning / check:jsx **238 文件**无问题 / vitest **46 文件 162 用例全绿**，v1.5.1 时为 44 文件 142 用例）
- `npm run build`（Vite web）— Passed（首包 **736.29 kB** / gzip **221.10 kB**）
- 桌面 `npm run tauri build` — BUILD SUCCESSFUL：`Tilo_1.6.0_x64_en-US.msi`（3.32 MB）、`Tilo_1.6.0_x64-setup.exe`（2.37 MB）
- Android `cap copy` + `gradlew assembleDebug --offline` — BUILD SUCCESSFUL：`app-debug.apk`（**4.74 MB**）
  > 注意 APK 体积与 v1.5.1（4.71 MB）几乎没变。Web 产物只占 APK 的一小部分，Capacitor 与原生依赖才是主体，所以首屏优化不会体现在安装包大小上——它体现的是**启动后的解析与执行时间**。
- 版本号：`package.json` / `package-lock.json` / `src-tauri/tauri.conf.json` = `1.6.0`；`android/app/build.gradle` = versionName `1.6.0` / versionCode `10`；`src-tauri/Cargo.toml` 按项目惯例保持 `0.1.0`

### 仍待处理

- `SettingsPage`（159.98 kB）与 `TodayPage`（89.95 kB）仍是较大的路由 chunk，可再按 Tab / 区块细拆；
- `LanSyncModal` 的 380 kB 里绝大部分是 `html5-qrcode`，若扫码只在移动端用，可按平台条件加载；
- 挂件配置面板（`standalone/panels/*`）内部文案仍为中文，双语化留待下一轮；
- `TodayPage`（679 行）、`TaskInspector`（663 行）、`WeeklyReviewModal`（660 行）是下一梯队，尚未拆分。
