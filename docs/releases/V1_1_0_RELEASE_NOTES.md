# Tilo v1.1.0 Release Notes

> Release Date: 2026-08-27  
> Version: `1.1.0`  
> Platforms: Desktop Web, PWA Standalone Client, Android APK Native Package

---

## 🌟 Major Highlights & New Features

### 1. 📱 Multi-Platform Expansion (PWA & Android Native Gradle)
- **PWA Standalone Desktop Client**:
  - One-click install from Chrome / Edge to create a distraction-free, windowed standalone application with custom taskbar and desktop icons.
  - Native offline Service Worker (`public/sw.js`) caching core app shell and static resources with stale-while-revalidate strategy.
- **Android APK Native Package**:
  - Capacitor Android native project integration with full local Gradle build pipeline (`./gradlew assembleDebug`).
  - 100% offline Dexie database, Web Audio engine, and full execution loop packaged into a 4.5 MB lightweight APK.

### 2. ⚡ Dual-Channel Quick Capture & Smart Clipboard Paste
- **Dual-Channel Separation**:
  - **Instant Raw Inbox Capture (<kbd>Shift+Space</kbd>)**: Zero-friction raw thought and note dumping straight into the Inbox for subsequent triage.
  - **Quick Task Creator HUD (<kbd>C</kbd>)**: High-velocity natural language parser supporting project (`#proj`), priority (`!high`), estimate (`30m`/`1h`), and time schedule (`14:00`).
- **Global Smart Clipboard Paste (<kbd>Ctrl+V</kbd>)**:
  - Automatically captures clipboard text when pressed outside active inputs, pre-filling and tokenizing into the Quick Task HUD.

### 3. 🎯 Strategic Roadmap Gantt & Goal Execution Tree
- Seamlessly toggle between Card Grid, Dense List, and interactive **Roadmap Gantt** view modes on the Goals page.
- Visual hierarchy aggregating Strategic Goals → Projects → Milestones with progress tracks and achievement indicators.

### 4. 📊 Advanced Analytics & Chronotype Energy Matrix
- **Annual Focus Heatmap**: 52-week x 7-day GitHub-style focus matrix tracking streaks, active days, and consistency.
- **24-Hour Chronotype Energy Matrix**: Hourly focus distribution chart discovering individual peak productivity windows.
- **Full Dashboard Customization**: Toggle individual analytics modules on/off with persistent layout preferences.

### 5. 🤖 Smart Day Auto-Packing Engine
- Discovers free gaps across the workday timeline and greedily fits candidate tasks based on priority, due dates, and duration estimates.
- Rich customization drawer: Adjustable workday hours (08:00–22:00), buffer gap between blocks (0m–15m), default duration estimates, and one-click undo.

---

## 🧪 Verification & Quality Baseline

- **TypeScript**: 0 Errors (`tsc --noEmit`)
- **ESLint**: 0 Errors, 0 Warnings (`eslint .`)
- **Unit Tests**: 40 Test Suites, 112 Tests Passing (`vitest run`)
- **Web Production Build**: Success (`vite build`)
- **Android APK Build**: Success (`./gradlew assembleDebug` -> `app-debug.apk`, 4.5 MB)
