# Tilo v1.2.0 Release Notes

> Release Date: 2026-09-02  
> Version: `1.2.0`  
> Platforms: Tauri Desktop Native (.exe / .msi), Desktop Web, PWA Standalone Client, Android APK

---

## 🌟 Major Highlights & New Features

### 1. 🪟 Standalone Desktop Widgets Suite (Tauri v2 Integration)
- **6 Independent Native Desktop Widgets**:
  - **Today Tasks (今日待办)**: Multi-filter task list (`Focus`, `Today`, `Done`, `All`), priority dots, inline completion, and quick task launching.
  - **Quick Inbox (闪念收集)**: 4-category workflow (`Unsorted`, `Ideas + Notes`, `Archived`, `All`), inline note browsing/copy/deletion, and one-click capture.
  - **Pomodoro Focus (专注番茄)**: Live timer with ring progress, customizable target duration, and quick finish/stop controls.
  - **Schedule Timeline (日程时间线)**: Mini interactive timeline of scheduled planned blocks and executed sessions with live time marker.
  - **Scratchpad Notes (随手便签)**: Markdown scratchpad with Edit, Split, and Preview modes, autosaved to local IndexedDB.
  - **Goals Dashboard (核心目标看板)**: Weekly Focus goals progress monitoring with milestone indicators.
- **5 Curated Architectural Window Themes**:
  - `Glassmorphism (磨砂毛玻璃)`: Ultra-clean frosted glass with backdrop blur.
  - `Minimal Dark (暗黑极简)`: OLED deep black with subtle borders.
  - `Clean Paper (纸质纹理)`: Warm editorial reading tone with delicate borders.
  - `Borderless Float (无界悬浮)`: Frame-free modern floating aesthetic.
  - `Retro Terminal (复古终端)`: High-contrast green phosphor tech styling.
- **5-Key Unified Header Architecture**:
  - Pin on Top (置顶), Window Position Lock (防误触锁定), Widget Settings (配置抽屉), Dark/Light Theme (主题切换), and Close (关闭).
  - Per-button visibility configuration: Always visible, Hover fade-in, or Completely hidden.

### 2. ⚡ Inline Tasks Quick Capture & Natural Language Parsing
- **Header '+' Toggle**: Expandable input bar with zero vertical footprint when collapsed.
- **Full NLP Intelligent Parser**:
  - Automatically parses flexible dates (`明天`, `后天`, `下周一`), times (`14:00` creates planned blocks), durations (`30m`, `1h`), priorities (`!high`, `!urgent`), and projects (`#项目`).
  - Dates default to today only when omitted, honoring user-specified target dates.
- **Persistent Syntax Chips**:
  - Quick chips (`📅 明天`, `⏱️ 30m`, `⚡ !high`, `🚨 !urgent`, `🎯 #项目`) remain permanently visible during typing, enabling frictionless multi-chip chaining.
  - Real-time live preview capsules display recognized attributes dynamically.

### 3. 📥 Unified 4-Category Inbox & Top-Bar Quick Capture
- **Exact Main App Alignment**:
  - `Unsorted (未整理)`: Pending inbox items.
  - `Ideas (灵感)`: Someday/Idea backlog items + Work Notes combined.
  - `Archived (已归档)`: Restorable or permanently deletable archive.
  - `All (全部)`: Combined total of all three categories.
- **Inline Collapsible Capture**:
  - Input field converted to a top-bar '+' toggle button, freeing 100% of vertical list space.
  - Auto-focus, enter-to-submit with retained focus for rapid multi-item braindumping, and `Esc` to collapse.
- **Icon-First Tab Layout**:
  - Default ultra-compact icon-first display with circular badges.
  - Top-bar `LayoutGrid` button to cycle between `Icon`, `Text`, and `Both` modes.

### 4. 🔒 Per-Widget Position Locking & Smart Fold/Restore
- **Granular Single-Window Lock**:
  - Titlebar lock operates on the current active widget window independently, with state persisted to layout configuration.
  - Global widget lock retained in Main App Settings.
- **Double-Click Compact Folding & Auto Restoration**:
  - Double-clicking the titlebar collapses the widget to titlebar-only mode.
  - Resizing or dragging window borders automatically expands and restores full content, eliminating blank view bugs.

---

## 🧪 Verification & Quality Baseline

- **TypeScript**: 0 Errors (`npm run typecheck`)
- **ESLint**: 0 Errors, 0 Warnings (`eslint .`)
- **Unit Tests**: 43 Test Suites, 130 Tests Passing (`npm run test`)
- **Web Production Build**: Success (`npm run build`)
- **Tauri Native Desktop Build**: Success (`npm run tauri:build` -> `Tilo_1.2.0_x64-setup.exe`, `app.exe`)
