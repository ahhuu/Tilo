# Tilo v1.3.0 Release Notes

> Release Date: 2026-10-21
> Version: `1.3.0`
> Platforms: Tauri Desktop Native (.exe / .msi), Desktop Web, PWA Standalone Client, Android APK

---

## 🌟 Major Highlights & New Features

### 1. 📱 Touch-First Mobile Interaction Rebuild (移动端交互重构)

- **Tap-to-Schedule (点按排期)**: unscheduled tasks on Today expose a dedicated schedule button that drops them straight onto the timeline — no drag-and-drop required.
- **Reorder Without Dragging (排序三范式)**: Daily Focus items can be reordered with always-visible ↑/↓ buttons, keyboard arrows, or `TouchSensor` long-press drag (250 ms activation, 8 px tolerance).
- **Long-Press Time Blocks (长按建块)**: long-pressing the timeline grid for 250 ms starts block creation; a short tap instantly creates a 30-minute block; moving more than 10 px cancels the timer so vertical scrolling is never hijacked (`pointercancel` handled).
- **Projects Entry (项目入口)**: the mobile bottom-navigation drawer now exposes Projects, with a dedicated bottom sheet listing projects for direct navigation.
- **BottomSheet & ConfirmDialog**: new mobile-first primitives replaced modal dialogs and native `window.confirm` / `window.prompt` in the main mobile entry points.

### 2. ⚡ Native Mobile Capabilities (原生能力接入)

Powered by four Capacitor plugins — `@capacitor/haptics`, `@capacitor/keyboard`, `@capacitor/local-notifications`, `@capacitor/share`.

- **Haptics**: light/medium/heavy impact feedback on reorder, block creation and commit actions.
- **Focus-End Notifications**: the floating focus timer schedules a system notification at the target end time, so focus completion is still announced when the WebView is throttled in the background.
- **System Share**: report/backup exports open the native share sheet instead of a browser download.
- **Keyboard Handling**: `windowSoftInputMode="adjustResize"` plus `Keyboard` listeners scroll the focused input into view and expose the keyboard height.

### 3. 🔁 Symmetric LAN Sync & Automatic Syncing (双端对称同步 + 自动同步)

- **The phone now hosts a sync server**: a lightweight native Android HTTP service (port `27123`) mirrors the desktop Rust service, so the **desktop can initiate a sync to the phone** — previously only the phone could reach the desktop.
- **Automatic peer discovery**: the desktop emits the source IP of every incoming merge (`lan-sync-peer`), and the phone records the caller IP through a `window.__tiloSyncOnPeer` callback. Both ends remember peers across sessions; no re-scanning required.
- **15-second auto-sync loop**: `SyncManager` refreshes its own payload, probes known peers and merges both directions whenever a peer is reachable.
- **Silent by default**: merges only notify when data actually changed (updated + added > 0), throttled to at most one toast per 10 seconds.

---

## 🐛 Bug Fixes

- Focus timer kept playing ambient audio after a session was discarded or finished.
- Back navigation on the Calendar page returned to the Review Hub instead of closing the topmost overlay (planning drawer / modal).
- Inbox checkboxes rendered oversized on touch devices (tap target expanded without inflating the visual checkbox).
- LAN sync flooded the UI with toasts: duplicate `lan-sync-received` listeners were registered each time the sync modal opened and never cleaned up.
- Phone → desktop sync never ran: manual and QR-code syncs bypassed `SyncManager`, so the phone's peer list stayed empty and only the desktop ever initiated.

---

## 📦 Build & Verification

- `npm run typecheck`, `npm run lint`, `npm run test` (130/130) and `npm run build` all pass.
- Desktop: `npm run tauri build` → `Tilo_1.3.0_x64_en-US.msi` / `Tilo_1.3.0_x64-setup.exe`.
- Android: `npx cap copy android` + `gradlew assembleDebug` → `app-debug.apk` (versionName `1.3.0`, versionCode `6`).

> **Note**: both the desktop installer and the Android APK must be reinstalled — the sync changes touch native code on both platforms and cannot be delivered via web assets alone.

---

## ⚠️ Known Limitations

- When the Android app is fully backgrounded or the device is locked, the system may reclaim its sync service; the desktop cannot pull from the phone in that window. Opening the app reconnects and syncs both directions automatically.
- The plain web build (browser) does not host a sync server; only the Tauri desktop app and the Capacitor Android app participate in LAN sync.
