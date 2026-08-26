# Tilo — Start Here for Codex / AI Agent

This folder is an execution package for a new project.

## First instruction to the agent

Use this prompt after placing the contents in the project root:

> Read `AGENTS.md`, `docs/MASTER_PLAN.md`, `DEVELOPMENT_STATUS.md`, and `ACCEPTANCE_CHECKLIST.md` before changing anything. Start from the `Next task` in `DEVELOPMENT_STATUS.md`. Follow the frozen architecture and UI references. Implement a coherent vertical slice, run the required checks, and update `DEVELOPMENT_STATUS.md` with files changed, completed functionality, TypeScript/ESLint/test/build results, known issues, and the exact next task. Do not add backend/auth/cloud/AI features and do not change the technology stack without an explicit documented reason.

## Suggested initial commands

Use Node 24 LTS.

Initialize the project in the same root without deleting this documentation. A typical bootstrap is:

```bash
npm create vite@latest . -- --template react-ts
npm install
```

Then install the dependencies required by the Master Plan and configure quality scripts.

The agent should verify current compatible patch versions rather than blindly copying an old lockfile. Keep package majors aligned with `docs/MASTER_PLAN.md`.

## Important

The design screenshots are references, not HTML templates. Rebuild them with reusable React components and the defined Design System.
