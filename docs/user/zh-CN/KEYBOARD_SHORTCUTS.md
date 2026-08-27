# Tilo 快捷键清单 (Keyboard Shortcuts)

> English version → [../en/KEYBOARD_SHORTCUTS.md](../en/KEYBOARD_SHORTCUTS.md)

Tilo 支持全键盘操作与流畅导航。以下为当前 V1 版本支持的所有快捷键与使用范围（Scope）。

---

## 1. 全局快捷键 (Global Shortcuts)

| Windows / Linux | macOS | 功能作用 | 生效范围 (Scope) |
| :--- | :--- | :--- | :--- |
| <kbd>C</kbd> | <kbd>C</kbd> | 呼出**任务速记 HUD**（支持自然语言解析 `!high`、`#项目`、`30m`、`明天 14:00`） | 全局（输入框聚焦时除外） |
| <kbd>B</kbd> | <kbd>B</kbd> | **时间轴快速新建排期块**（严格从当前真实时刻开始新建 1 小时排期草稿） | 时间轴 / 日历 / 今日（输入框聚焦时除外） |
| <kbd>Shift</kbd> + <kbd>Space</kbd> | <kbd>Shift</kbd> + <kbd>Space</kbd> | 呼出**闪念快速收集弹窗**（零阻力倾倒未经分类的碎片想法至收集箱） | 全局 |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>V</kbd> | **智能剪贴板一键转录**（自动捕获外部复制文本并填入任务速记 HUD） | 全局（输入框聚焦时除外） |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | <kbd>Cmd</kbd> + <kbd>K</kbd> | 打开全局命令菜单 (Command Menu)，支持搜索路由与任务 | 全局任何页面 |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | <kbd>Cmd</kbd> + <kbd>Z</kbd> | 全局撤销 (Undo) 最近一次操作 | 全局（输入框聚焦时除外） |
| <kbd>[</kbd> | <kbd>[</kbd> | 折叠或展开左侧主导航栏 (Toggle Sidebar) | 全局（输入框聚焦时除外） |
| <kbd>Esc</kbd> | <kbd>Esc</kbd> | 关闭当前弹窗、检视器 (Inspector) 或取消聚焦 | 全局 |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | 顺序移动焦点 / 反向移动焦点 | 全局 |

---

## 2. 收件箱与连续整理模式 (Inbox & Continuous Processing)

| 快捷键 | 功能作用 | 生效范围 |
| :--- | :--- | :--- |
| <kbd>P</kbd> | 启动收件箱全屏连续整理模式 (Process Inbox Continuous Mode) | 收件箱页面 (Inbox Page) |
| <kbd>1</kbd> | 安排至**今天 (Today)** 并转换为任务 | 连续整理模式下 |
| <kbd>2</kbd> | 安排至**本周 (This Week)** 并转换为任务 | 连续整理模式下 |
| <kbd>3</kbd> | 移入**择日 (Someday)** 储备池 | 连续整理模式下 |
| <kbd>T</kbd> | 弹出转为任务高级选项模态框 (Convert to Task) | 连续整理模式下 |
| <kbd>N</kbd> | 转换为独立笔记 (Convert to Note) | 连续整理模式下 |
| <kbd>I</kbd> | 标记为想法 (Mark as Idea) | 连续整理模式下 |
| <kbd>A</kbd> | 直接归档 (Archive) | 连续整理模式下 |
| <kbd>X</kbd> | 移至废纸篓删除 (Delete to Trash) | 连续整理模式下 |
| <kbd>J</kbd> | 查看下一个待整理项目 (Next Item) | 连续整理模式下 |
| <kbd>K</kbd> | 查看上一个待整理项目 (Previous Item) | 连续整理模式下 |
| <kbd>Esc</kbd> | 退出连续整理模式返回列表 | 连续整理模式下 |

---

## 3. 命令菜单与导航 (Command Menu Navigation)

| 快捷键 | 功能作用 |
| :--- | :--- |
| <kbd>↑</kbd> / <kbd>↓</kbd> | 在命令与搜索结果列表中上下高亮移动 |
| <kbd>Enter</kbd> | 确认执行当前高亮的命令或跳转路由 |
| <kbd>Esc</kbd> | 关闭命令菜单 |

---

## 4. 任务检视器与模态框 (Inspector & Modals)

| 快捷键 | 功能作用 |
| :--- | :--- |
| <kbd>Esc</kbd> | 关闭右侧检视器 (Inspector Shell) 或退出编辑弹窗 |
| <kbd>Enter</kbd> (在单行输入框中) | 提交保存标题、更新字段 |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> | 在多行描述或反思问卷中确认提交 |

---

## 5. 无障碍与键盘焦点 (Accessibility)

- Tilo 全局支持标准 WAI-ARIA 焦点环提示 (`:focus-visible`)。
- 当处于弹窗或检视器内部时，焦点将被安全捕获（Focus Trap），防止误触底层背景元素。
- 按 <kbd>Esc</kbd> 退出弹窗后，键盘焦点将自动返回之前触发弹窗的元素。
