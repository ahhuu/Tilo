# Tilo Keyboard Shortcuts

> 简体中文版 → [../zh-CN/KEYBOARD_SHORTCUTS.md](../zh-CN/KEYBOARD_SHORTCUTS.md)

Tilo provides comprehensive keyboard navigation for high-velocity personal workflows. Below is the complete reference of all verified shortcuts supported in V1.

---

## 1. Global Shortcuts

| Windows / Linux | macOS | Action | Scope |
| :--- | :--- | :--- | :--- |
| <kbd>C</kbd> | <kbd>C</kbd> | Open **Quick Task HUD** (NLP syntax: `!high`, `#project`, `30m`, `14:00`) | Global (outside text inputs) |
| <kbd>Shift</kbd> + <kbd>Space</kbd> | <kbd>Shift</kbd> + <kbd>Space</kbd> | Open **Instant Raw Inbox Capture** modal (Zero-friction raw dumping) | Global |
| <kbd>Ctrl</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>V</kbd> | **Smart Clipboard Paste** (Auto-load copied text into Quick Task HUD) | Global (outside text inputs) |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | <kbd>Cmd</kbd> + <kbd>K</kbd> | Open Command Menu (Search routes & tasks) | Global anywhere |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | <kbd>Cmd</kbd> + <kbd>Z</kbd> | Global Undo Last Action | Global (outside text inputs) |
| <kbd>[</kbd> | <kbd>[</kbd> | Toggle Sidebar collapse / expand | Global (outside text inputs) |
| <kbd>Esc</kbd> | <kbd>Esc</kbd> | Close active modal, Inspector drawer, or dismiss focus | Global |
| <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | <kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> | Cycle keyboard focus forward / backward | Global |

---

## 2. Inbox & Continuous Processing Mode

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>P</kbd> | Open full-screen Continuous Inbox Triage mode | Inbox Page |
| <kbd>1</kbd> | Schedule for **Today** and convert to Task | Inside Continuous Mode |
| <kbd>2</kbd> | Schedule for **This Week** and convert to Task | Inside Continuous Mode |
| <kbd>3</kbd> | Move to **Someday** backlog | Inside Continuous Mode |
| <kbd>T</kbd> | Open Convert to Task modal with options | Inside Continuous Mode |
| <kbd>N</kbd> | Convert to Note | Inside Continuous Mode |
| <kbd>I</kbd> | Mark as Idea | Inside Continuous Mode |
| <kbd>A</kbd> | Archive item | Inside Continuous Mode |
| <kbd>X</kbd> | Delete item to Trash | Inside Continuous Mode |
| <kbd>J</kbd> | Next item | Inside Continuous Mode |
| <kbd>K</kbd> | Previous item | Inside Continuous Mode |
| <kbd>Esc</kbd> | Exit Continuous Mode | Inside Continuous Mode |

---

## 3. Command Menu Navigation

| Shortcut | Action |
| :--- | :--- |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Navigate up and down through search results |
| <kbd>Enter</kbd> | Execute selected command or navigate to route |
| <kbd>Esc</kbd> | Dismiss Command Menu |

---

## 4. Inspector & Modals

| Shortcut | Action |
| :--- | :--- |
| <kbd>Esc</kbd> | Close right-side Inspector or active modal |
| <kbd>Enter</kbd> (in single-line fields) | Commit title edits / field changes |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> / <kbd>Cmd</kbd> + <kbd>Enter</kbd> | Submit multi-line description or reflection form |

---

## 5. Accessibility & Focus Traps

- Tilo implements standard WAI-ARIA `:focus-visible` styling across all clickable buttons and interactive items.
- Active dialogs and drawers feature automatic focus trapping to prevent background navigation while open.
- Pressing <kbd>Esc</kbd> restores keyboard focus to the triggering element.
