#!/usr/bin/env node
/**
 * Static checks that `tsc` does NOT cover in this project.
 *
 * Why this exists (v1.5.0 post-mortem):
 *   - `tsconfig.json` is a references-only shell, and `tsc -b` resolves JSX tag
 *     names loosely. A stray `</div>` before `</Modal>` type-checks clean but
 *     esbuild (and therefore `vite build`) rejects it.
 *   - A missing `import Modal from '@/components/ui/Modal'` also type-checks
 *     clean and only blows up at runtime, the moment the dialog is opened.
 *
 * v1.5.0 shipped 4 unbalanced files and 2 missing imports that neither
 * `tsc --noEmit` nor `tsc -b` reported. This script caught them once; it is
 * committed so the next occurrence fails loudly instead of shipping.
 *
 * Checks:
 *   1. Every .ts/.tsx parses through esbuild (catches JSX balance / syntax).
 *   2. Every file using `<Modal` imports it.
 *
 * Usage: `npm run check:jsx` (also part of `npm run verify`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import esbuild from 'esbuild';

const ROOT = 'src';
const MODAL_IMPORT =
  /import\s+(?:Modal\s+from|\{[^}]*\bModal\b[^}]*\}\s+from)\s+['"]@\/components\/ui\/Modal['"]/;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else if (path.endsWith('.tsx') || path.endsWith('.ts')) out.push(path);
  }
  return out;
}

const files = walk(ROOT);
const problems = [];

for (const file of files) {
  const code = readFileSync(file, 'utf8');

  // 1. Syntax and JSX tag balance.
  try {
    await esbuild.transform(code, {
      loader: file.endsWith('.tsx') ? 'tsx' : 'ts',
      jsx: 'automatic',
    });
  } catch (error) {
    const first = error.errors?.[0];
    const line = first?.location?.line ?? '?';
    problems.push(`${file}:${line}  ${first?.text ?? error.message}`);
    continue;
  }

  // 2. `<Modal` without an import.
  if (/<Modal[\s>/]/.test(code) && !MODAL_IMPORT.test(code)) {
    problems.push(`${file}  uses <Modal> but does not import it from '@/components/ui/Modal'`);
  }
}

if (problems.length > 0) {
  console.error(`\ncheck:jsx failed — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error(
    '\n  hint: "Unterminated regular expression" inside a .tsx file almost always\n' +
      '  means a stray closing tag — e.g. an extra </div> right before </Modal>.\n'
  );
  process.exit(1);
}

console.log(`check:jsx — ${files.length} files scanned, no problems.`);
