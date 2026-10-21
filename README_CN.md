# Tilo — 桌面优先、本地优先的个人执行系统

> **Tilo** 是一个专为知识工作者设计的本地优先（Local-first）个人规划与深度执行系统。
> 采用克制、类似 Linear 的精致美学、严格的领域模型层级，以及零云端依赖的数据架构。

[English Documentation](README.md) | 简体中文文档

---

## 发行状态 (Release Status)

**当前正式版本**: `Tilo v1.4.0`  
**状态**: `Production Ready`（桌面 Web 端、Tauri 原生桌面端、PWA 独立客户端与 Android APK 移动端全量验证通过）  
**本版亮点**: 首次启动引导与示例数据透明化、统计分析「说人话」（空状态 + 指标怎么看 + 规则生成的一句话结论）、新增任务 / 项目总览索引路由。

---

## 用户文档 (User Documentation)

### 简体中文 (zh-CN)
- [快速上手指南 (Quick Start)](docs/user/zh-CN/QUICK_START.md) — 5–10 分钟完成第一个执行闭环
- [核心概念与模型 (Concepts)](docs/user/zh-CN/CONCEPTS.md) — 领域分级模型、术语表及核心概念辨析
- [完整用户使用手册 (User Guide)](docs/user/zh-CN/USER_GUIDE.md) — Today、Calendar、Inbox、Analytics、Review 等全功能指南
- [快捷键清单 (Keyboard Shortcuts)](docs/user/zh-CN/KEYBOARD_SHORTCUTS.md) — 全键盘高效导航与操作参考
- [数据存储与备份指南 (Data & Backup)](docs/user/zh-CN/DATA_AND_BACKUP.md) — IndexedDB 本地存储原理与 JSON 导出恢复
- [常见问题解答 (FAQ)](docs/user/zh-CN/FAQ.md) — 25 个常见疑问与边界情况深度解答

### English (en)
- [Quick Start Guide](docs/user/en/QUICK_START.md) — Complete your first execution cycle in 5–10 minutes
- [Core Concepts & Model](docs/user/en/CONCEPTS.md) — Domain hierarchy, glossary, and core distinctions
- [Comprehensive User Guide](docs/user/en/USER_GUIDE.md) — In-depth guide across all modules and workflows
- [Keyboard Shortcuts Reference](docs/user/en/KEYBOARD_SHORTCUTS.md) — Global and module hotkey cheat sheet
- [Data & Backup Guide](docs/user/en/DATA_AND_BACKUP.md) — Local persistence architecture and JSON backup/restore
- [Frequently Asked Questions (FAQ)](docs/user/en/FAQ.md) — Answers to 25 common questions and edge cases

---

## 核心设计哲学

1. **本地优先与数据完全归属 (Local-First)**：
   - 你的所有数据（目标、项目、任务、执行会话、时间块、复盘快照）全部安全保存在当前浏览器的 **IndexedDB (Dexie 4)** 中。
   - **无需登录、无云端后端、无数据追踪、无外部 AI 接口依赖**。
   - 提供一键 JSON 备份导出与 Zod 结构安全校验导入。

2. **固定领域执行层级 (Domain Hierarchy)**：
   ```text
   Goal (战略目标)
     └── Project (阶段项目)
           └── Task (具体任务，严格单层子任务)
                 └── Session (前台有效专注 vs 后台会话)
   ```

3. **时间完整性与计划/实绩对比 (Plan vs Actual)**：
   - 清晰分离 **计划时间块 (Ghost Plan)** 与 **实际执行会话 (Solid Actual)**。
   - 遵循自定义逻辑日切分点（如凌晨 04:00），确保深夜专注归入正确的逻辑日。

4. **克制精美的美学体验**：
   - 统一 Indigo 主色调 (`#4F46E5`)、微动效、浅色/深色/跟随系统主题、舒适/紧凑间距。
   - **绝无激励或内疚文案** — 纯粹呈现客观事实。

---

## 核心功能模块

- **今日视图 (`/today`)**：分栏/列表/时间轴三视图、今日聚焦 (Focus #1–#3) 排序与替换向导、下一步智能建议 (Next Up)。
- **日历规划 (`/calendar`)**：日视图、周视图（5/7天）、议程列表，支持 15 分钟吸附拖拽排期与每日容量上限提示。
- **收件箱 (`/inbox`)**：全局即时捕获 (`C`)、链接自动识别、全屏单键连续整理模式 (`P`)。
- **目标与项目 (`/goals`, `/projects`)**：支持任务完成率与量化指标跟踪、里程碑管理、看板与列表视图。
- **统计分析 (`/analytics`)**：时间准确度、排期准确度、完成准确度、临时插入工作 (Unplanned Work) 及多维时间分配分析。
- **复盘中心 (`/review`)**：3 步每日收尾与 6 步每周复盘向导，自动生成周度叙事与不可变历史快照。
- **设置与定制 (`/settings`)**：外观、动效级别、自定义工作流状态、任务/反思模板与数据备份恢复。
- **桌面独立挂件 (Desktop Widgets)**：基于 Tauri 的 6 款独立轻量桌面浮窗（今日待办、闪念收集、专注番茄、日程时间线、随手便签、核心目标），支持 5 款质感主题（毛玻璃/暗黑极简/纸质/无界悬浮/复古终端）、独立位置锁定、双击折叠展开与内联自然语法速记。

---

## 全局快捷键

| 快捷键 | 功能 | 生效范围 |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | 打开全局命令菜单 | 全局 |
| <kbd>[</kbd> | 折叠 / 展开侧边栏 | 全局 |
| <kbd>C</kbd> | 呼出即时捕获模态框 | 全局 |
| <kbd>P</kbd> | 启动收件箱连续整理模式 | 收件箱页面 |
| <kbd>Esc</kbd> | 关闭弹窗或检视器抽屉 | 全局 |

---

## 运行与开发环境

```bash
# 克隆仓库
git clone https://github.com/your-org/tilo.git
cd tilo

# 安装依赖
npm install

# 启动 Web 本地开发服务
npm run dev

# 启动 Tauri 原生桌面端开发环境
npm run tauri:dev

# 类型检查与代码校验
npm run typecheck
npm run lint

# 运行单元测试
npm run test

# 生产环境 Web 构建打包
npm run build

# 构建 Tauri 原生桌面客户端安装包 (.exe / .msi)
npm run tauri:build
```

---

## 本地数据安全提示

由于 Tilo 100% 本地运行在浏览器中，清理浏览器站点数据或 Cookie 将清除本地 IndexedDB。请在 **设置 → 数据** 中定期导出 JSON 备份以确保数据安全。

---

## 开源协议

MIT License.
