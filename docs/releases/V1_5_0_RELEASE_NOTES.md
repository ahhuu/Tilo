# Tilo v1.5.0 Release Notes

> Release Date: 2026-10-21
> Version: `1.5.0`
> Platforms: Tauri Desktop Native (.exe / .msi), Desktop Web, PWA Standalone Client, Android APK

---

## 🌟 Major Highlights & New Features

### 1. 🪟 Unified Modal Shell — One Dialog, Everywhere (统一弹窗外壳)

- **Single `Modal` primitive**: all 20 card-style dialogs now render through one shared shell (`components/ui/Modal.tsx`). It owns the overlay (`z-[9999]`, `--modal-overlay` token, `backdrop-blur`), the mobile bottom-sheet / desktop centered-card behavior, scroll locking, `Esc` to close, focus trap with focus restore, `role="dialog"` + `aria-modal`, and safe-area padding — so every dialog behaves identically.
- **Removed the Android IME regression**: the old hand-written overlays sprinkled `select-none` on containers with `<textarea>` (e.g. task detail, auto-pack, widget settings). That broke Chinese input-method composition on Android WebView ("type but nothing shows until you delete a char"). The unified shell never adds `select-none`, so the bug is gone for good.
- **Migrated modals include**: Revision History, Weekly Review, LAN Sync, Task Detail, Auto-Pack, Focus Full, Widget Settings, Inbox Edit Note, Continuous Processing, Analytics Customizer, Window Close Confirm, Calendar Reset, Today Focus Picker, plus the remaining standard card dialogs. Intentionally **excluded** (by design): the full-screen immersive Focus Zen mode, slide-in drawers (Inspector / Allocation / Side Planning), the ⌘K command palette, and the anchored inline-create popover.

### 2. ⌨️ Keyboard Alternatives for Drag (拖拽的键盘替代)

Every drag interaction now has a keyboard-accessible equivalent:

- **Timeline planned blocks** (`TimelineView`): focus a block and press `↑/↓` to shift ±15 min, `Shift+↑/↓` for ±1 hour, `Enter`/`Space` to inspect, `Delete`/`Backspace` to remove. Changes persist through the existing `onUpdatePlannedBlock` prop and are announced via an `aria-live` region.
- **Week-view planned blocks** (`WeekView`): `←/→` move the block ±1 day, `↑/↓` ±1 hour (within the 08:00–20:00 grid), `Enter` inspects, `Delete` removes — a direct keyboard mirror of the HTML5 drag-drop scheduling.
- **Planning drawer** (`SidePlanningDrawer`): task cards are now focusable (`role="button"`, `tabIndex=0`); pressing `Enter`/`Space` inspects, and the `Plan` / `Today` actions reveal on `focus-within` (previously only on hover, leaving keyboard users with invisible controls).
- **Daily focus reorder** already shipped keyboard support via `@dnd-kit` `sortableKeyboardCoordinates` — confirmed intact.

### 3. ♿ Accessibility Baseline (无障碍基线)

- **Toasts are now announced**: `ToastContainer` is a persistent `role="region"` live region; each toast carries `role="status"` (+ `aria-live="polite"`) for info/success/warning and `role="alert"` (+ `aria-live="assertive"`) for errors, so screen readers actually read feedback.
- **Visible keyboard focus, everywhere**: a single `:focus-visible` baseline (indigo ring) now applies to native controls and `role="button"` elements, so keyboard users can always see where they are — dialogs themselves are exempt.
- **Icon-only close buttons have real names**: 14 components (modals, mobile nav, drawers, widget shells) gained `aria-label`s, so "×" is no longer announced as a bare glyph.
- **Hover-only controls are keyboard-reachable**: drawer actions reveal on `focus-within`, and the week-view block delete button reveals on `focus-visible`.
- **Feedback is fully converged**: the entire app routes user feedback through one `uiStore.addToast({ message, type })` channel (`info | success | warning | error`) with undo support — no stray `window.alert`, inline banners, or parallel toast mechanisms remain.

---

## 🐛 Bug Fixes

- **Android Chinese IME composition break** on dialogs with text inputs — root-caused to `select-none` on the old overlay containers; eliminated by the unified `Modal` shell.
- **Two dialogs would have crashed on open**: `AnalyticsCustomizerModal` and `DailyCloseModal` used `<Modal>` after the migration dropped the import line. `tsc` stayed silent; both are now imported.
- **Latent JSX tag imbalance** in four migrated modals (`EditNoteModal`, `AnalyticsCustomizerModal`, `WindowCloseConfirmModal`, `ContinuousProcessingModal`) — an extra stray `</div>` before `</Modal>` that `tsc` tolerated but esbuild rejected at build time. All 198 source files now pass a full JSX balance scan.
- **Keyboard reschedule only moved once on key repeat** — timeline and week-view blocks now chain each keypress from the previous one instead of the stale block start, and clamp within the day timeline.
- **`npm run typecheck` checked nothing** — `tsconfig.json` is a references-only shell (`"files": []`), so `tsc --noEmit` was a no-op. It now runs `tsc -b --force`; verified by injecting a deliberate type error and seeing it fail.
- **Stale smoke test** asserting a legacy combined "目标与项目" nav entry — the sidebar now exposes separate 项目 / 目标 items; the test asserts the current labels.

---

## 📦 Build & Verification

- `npm run typecheck` (`tsc -b --force`) — Passed (0 errors).
- `npm run lint` — Passed (0 errors, 6 pre-existing `react-hooks/exhaustive-deps` warnings).
- `npm run test` — Passed (43 test files, 130/130 tests).
- `npm run build` (Vite web) — Passed (`dist/assets/index-BD01dxbh.js`, 1860.16 kB / gzip 509.60 kB).
- Desktop: `npm run tauri build` — **succeeded**
  - `src-tauri/target/release/bundle/msi/Tilo_1.5.0_x64_en-US.msi` (3.27 MB)
  - `src-tauri/target/release/bundle/nsis/Tilo_1.5.0_x64-setup.exe` (2.31 MB)
- Android: `npx cap copy android` + `gradlew assembleDebug --offline` — **BUILD SUCCESSFUL**
  - `android/app/build/outputs/apk/debug/app-debug.apk` (4.71 MB, versionName `1.5.0`, versionCode `8`)
- Version bumped in `package.json`, `package-lock.json`, `src-tauri/tauri.conf.json`, and `android/app/build.gradle`. `src-tauri/Cargo.toml` left at `0.1.0` per project convention.

> **Note**: the desktop installer and the Android APK are rebuilt for this release; reinstall to pick up the new version.

---

## ⚠️ Known Limitations

- Full-screen immersive Focus Zen mode and slide-in drawers intentionally remain outside the `Modal` shell (different interaction model).
- First-run onboarding / analytics i18n is still zh-CN / en only; broader i18n expansion is planned for v1.6.
