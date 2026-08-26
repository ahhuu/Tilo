# Engineering Baseline — validated 2026-08-21

This file records the package-family baseline used when the plan was written. The package lock created by the implementation becomes the exact reproducibility source.

| Area | Baseline |
|---|---|
| Runtime | Node.js 24 LTS (24.19.0 was current LTS) |
| React | React / React DOM 19.2.x (use >=19.2.7 if React Router 8 requires it) |
| Bundler | Vite 8.1.x |
| Language | TypeScript 6.0.x initially |
| Router | React Router 8.x, client/declarative use |
| CSS | Tailwind CSS 4.3.x + CSS variables/tokens |
| Animation | Motion 13.x |
| Local DB | Dexie 4.4.x + dexie-react-hooks |
| UI transient state | Zustand 5.x |
| Drag/drop | dnd-kit new API: @dnd-kit/react (+ helpers where needed) |
| Date/time | date-fns 4.x + @date-fns/tz |
| Charts | Recharts 3.x |
| Validation | Zod 4.x |
| Forms | React Hook Form |
| Accessible primitives | Radix UI Primitives |
| Icons | Lucide React 1.x |
| Unit tests | Vitest 4.x + Testing Library |
| E2E | Playwright 1.62+ |
| Lint | ESLint 10.x + current typescript-eslint compatible with TS6 |
| Format | Prettier 3.x |

## Why TypeScript 6, not 7, at bootstrap

TypeScript 7.0 was already stable when this plan was written, but typescript-eslint's documented supported range was still `>=4.8.4 <6.1.0`. We therefore prefer TypeScript 6 for a fully supported lint/type pipeline and can migrate later with an ADR.

## Official reference URLs

- https://react.dev/versions
- https://vite.dev/blog/announcing-vite8-1
- https://tailwindcss.com/blog/tailwindcss-v4-3
- https://motion.dev/docs/react
- https://dexie.org/docs/Tutorial/React
- https://dndkit.com/react/quickstart/
- https://blog.date-fns.org/v40-with-time-zone-support/
- https://recharts.github.io/en-US/
- https://vitest.dev/
- https://playwright.dev/docs/release-notes
- https://lucide.dev/guide/react
- https://www.radix-ui.com/primitives
- https://zustand.docs.pmnd.rs/
- https://typescript-eslint.io/users/dependency-versions/
