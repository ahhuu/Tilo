# Tilo Codex Execution Pack — Manifest

This package is intended to be placed at the root of a new Tilo repository before an AI coding agent begins implementation.

## Start files

- `README_AGENT_START.md` — human/agent entry point
- `CODEX_START_PROMPT.md` — copy-paste bootstrap prompt
- `AGENTS.md` — mandatory agent rules
- `DEVELOPMENT_STATUS.md` — persistent handoff checkpoint
- `ACCEPTANCE_CHECKLIST.md` — V1 release checklist

## Product and engineering specification

- `docs/MASTER_PLAN.md` — V1 source of truth
- `docs/DECISIONS.md` — frozen decisions / ADR log
- `docs/BRANDING.md` — final Tilo branding contract
- `docs/engineering/TECH_BASELINE.md` — package-family baseline

## Visual references

- `docs/design/reference/today.png`
- `docs/design/reference/calendar.png`
- `docs/design/reference/inbox.png`
- `docs/design/reference/goals.png`
- `docs/design/reference/project.png`
- `docs/design/reference/analytics.png`
- `docs/design/reference/review.png`
- `docs/design/reference/settings.png`

## Agent continuity rule

Every implementation session must update `DEVELOPMENT_STATUS.md` before finishing. The next agent starts from its `Next task` section rather than inventing a new roadmap.
