# Tilo — Desktop Web First, Local-First Personal Operating System

> **Tilo** is an opinionated, local-first personal planning and execution system designed for knowledge workers who care about deliberate focus, honest reflection, and calm clarity.
> Built with a restrained, Linear-like aesthetic, strict domain hierarchy, and zero cloud dependency.

English Documentation | [简体中文文档](README_CN.md)

---

## Release Status

**Current Release**: `Tilo v1.1.1`  
**Status**: `Production Ready` (Desktop Web, PWA Standalone & Android APK Validated)

---

## User Documentation / 用户文档

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

## Key Principles & Design Philosophy

1. **Local-First & Complete Privacy**:
   - All data (goals, projects, tasks, sessions, planned blocks, review snapshots) is stored exclusively in your browser via **IndexedDB (Dexie 4)**.
   - **No login, no cloud backend, no tracking, and no external AI API dependencies**.
   - One-click JSON backup export and Zod schema-validated restore.

2. **Fixed Execution Hierarchy**:
   ```text
   Goal (Strategic Intent)
     └── Project (Bounded Outcome)
           └── Task (Executable Unit, strictly 1-level Subtasks)
                 └── Session (Foreground Active Focus vs Background Tracking)
   ```

3. **Time Integrity & Plan vs Actual**:
   - Distinct separation between **Plan** (intended ghost blocks) and **Actual** (recorded foreground focus sessions).
   - Time calculations respect your configured **Day-start Cutoff** (e.g. 04:00 AM) and logical day boundaries.

4. **Calm, Restrained Aesthetic**:
   - Curated Indigo accents (`#4F46E5`), subtle micro-animations, light/dark/system themes, comfortable/compact density.
   - **Zero motivational or guilt-inducing copy** — strictly honest, factual reporting.

---

## Core Modules

- **Today (`/today`)**: Daily execution workbench with Split/List/Timeline layouts, Focus #1–#3 ranking, and Next Up recommendation.
- **Calendar (`/calendar`)**: Day, Week (5/7 days), and Agenda views with 15m grid snapping, ghost plan vs solid actual blocks, and capacity tracking.
- **Inbox (`/inbox`)**: Universal capture (`C`), URL auto-detection, and full-screen continuous triage mode (`P`).
- **Goals & Projects (`/goals`, `/projects`)**: Multi-mode goal progress tracking, milestone sequencing, and list/board project views.
- **Analytics (`/analytics`)**: 12 objective metrics including Time, Schedule, and Completion Accuracy, Start Delay, Unplanned Work, and Capacity analysis.
- **Review Hub (`/review`)**: 3-step Daily Close and 6-step Weekly Review with rule-generated weekly narratives and immutable revision snapshots.
- **Settings (`/settings`)**: Theme, density, motion level, custom workflows, templates, and data backup/restore.

---

## Global Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Open Command Menu | Global |
| <kbd>[</kbd> | Toggle Sidebar collapse / expand | Global |
| <kbd>C</kbd> | Open Instant Capture modal | Global |
| <kbd>P</kbd> | Open Continuous Inbox Triage mode | Inbox page |
| <kbd>Esc</kbd> | Dismiss active modal or Inspector drawer | Global |

*For the complete hotkey reference, see [Keyboard Shortcuts Guide](docs/user/en/KEYBOARD_SHORTCUTS.md).*

---

## Tech Stack & Requirements

- **Runtime**: Modern Evergreen Web Browsers (Chrome 110+, Edge 110+, Firefox 110+, Safari 16.4+)
- **Frontend**: React 19, TypeScript 5.7, Tailwind CSS v4, Motion 12, Lucide React
- **Storage**: IndexedDB via Dexie.js 4 & Dexie React Hooks
- **Testing**: Vitest, React Testing Library, Playwright E2E

---

## Getting Started & Development

```bash
# Clone the repository
git clone https://github.com/your-org/tilo.git
cd tilo

# Install dependencies
npm install

# Start local dev server
npm run dev

# Run typecheck & lint
npm run typecheck
npm run lint

# Run unit tests
npm run test

# Run E2E tests
npm run e2e

# Build production bundle
npm run build
```

---

## Local Data Responsibility

Because Tilo operates 100% locally in your browser, clearing site storage or browser cookies will delete your local IndexedDB database. Please routinely export a JSON backup via **Settings → Data** to keep your data safe.

---

## License

MIT License.
