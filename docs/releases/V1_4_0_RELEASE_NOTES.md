# Tilo v1.4.0 Release Notes

> Release Date: 2026-10-21
> Version: `1.4.0`
> Platforms: Tauri Desktop Native (.exe / .msi), Desktop Web, PWA Standalone Client, Android APK

---

## 🌟 Major Highlights & New Features

### 1. 🧭 First-Run Onboarding & Transparent Demo Data (首启引导 + 示例数据透明化)

- **First-run guide**: on first launch (and for upgrading users who haven't seen it), a 3-step Linear-style walkthrough explains the **plan → execute → review** loop, the desktop/phone division of labor, and the demo data. It reuses the shared `BottomSheet` primitive for full a11y — Esc to dismiss, scroll lock, `role="dialog"`, and focus management. Gated by `localStorage['tilo_has_seen_onboarding']` so it never nags returning users.
- **No more silent data injection**: injecting sample data now sets a `tilo_demo_data_seeded` marker and shows a disclosure toast ("已载入示例数据，可在设置→数据一键清空").
- **Always-visible clear entry**: Settings → Data now shows an amber banner whenever demo data is present, with a one-click "clear demo data" action — so the seed data is never a mystery.

### 2. 📊 Analytics That Speaks Human (分析页「说人话」)

- **"How to read" hints**: the four top-line metrics (Active Focus, Planned Time, Time Accuracy, Task Completion) each carry a plain-language hint, shown on hover/focus with an `aria-label` for screen readers.
- **One-line weekly conclusion**: a deterministic, **AI-free** `InsightSummary` distills the week's numbers into a single plain-language sentence (focus volume / plan-vs-actual fit / unplanned share / start delay / completion rate / over-capacity), and links straight back to `/today` and `/review` for the next action.
- **Two-state empty state**: instead of a blank dashboard, `AnalyticsEmptyState` distinguishes *truly no data* (with action entry points to Today/Review) from *not enough data yet* (a gentle nudge that still shows whatever modules have signal).

### 3. 🗂️ `/tasks` & `/projects` Index Routes (任务 / 项目索引路由)

- **`/tasks`**: a cross-project task view with filter (default **unfinished & committed**), sort (priority / due / scheduled / project / title) and grouping (none / by project). Quick-complete and reopen go through the domain commands; clicking a row opens the Inspector.
- **`/projects`**: project overview with task counts, completion progress bars and pinned markers; click through to `/projects/:id`.
- **Navigation**: both routes are reachable from the desktop sidebar and the mobile "More" drawer. The redundant mobile project-picker bottom sheet was removed in favor of the new index route.

---

## 🐛 Bug Fixes

- (No bug fixes in this pass — see v1.3.0 for the sync / IME fixes that shipped alongside the audit.)

---

## 📦 Build & Verification

- `npm run typecheck`, `npm run lint`, `npm run test` (130/130) and `npm run build` all pass.
- Desktop: `npm run tauri build` → `Tilo_1.4.0_x64_en-US.msi` / `Tilo_1.4.0_x64-setup.exe`.
- Android: `npx cap copy android` + `gradlew assembleDebug` → `app-debug.apk` (versionName `1.4.0`, versionCode `7`).

> **Note**: the desktop installer and the Android APK are rebuilt for this release; reinstall to pick up the new version.

---

## ⚠️ Known Limitations

- The plain web build (browser) does not host a sync server; only the Tauri desktop app and the Capacitor Android app participate in LAN sync.
- First-run onboarding text is currently zh-CN / en only; broader i18n expansion is planned for v1.6.
