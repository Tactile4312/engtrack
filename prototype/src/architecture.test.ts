// Keeps the code's layers tidy: fails when a change makes files depend on each other in a loop or in the wrong direction.
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob('./**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const files = Object.keys(sources).filter((f) => !f.includes('.test.'));

function resolve(from: string, spec: string): string | undefined {
  const parts = from.split('/').slice(0, -1);
  for (const p of spec.split('/')) {
    if (p === '..') parts.pop();
    else if (p !== '.') parts.push(p);
  }
  const base = parts.join('/');
  return [`${base}.ts`, `${base}.tsx`].find((f) => f in sources);
}

/** Imports that exist when the app runs; `import type` disappears at build time. */
const graph = Object.fromEntries(files.map((f) => {
  const deps = [...sources[f].matchAll(/^import\s+(?!type\b)[^;]*?from\s+'(\.[^']+)'/gms)]
    .map((m) => resolve(f, m[1]))
    .filter((d): d is string => !!d);
  return [f, deps];
}));

function findCycles(): string[] {
  const done = new Set<string>();
  const cycles: string[] = [];
  const visit = (f: string, path: string[]) => {
    const at = path.indexOf(f);
    if (at >= 0) return void cycles.push([...path.slice(at), f].join(' -> '));
    if (done.has(f)) return;
    for (const d of graph[f] ?? []) visit(d, [...path, f]);
    done.add(f);
  };
  files.forEach((f) => visit(f, []));
  return cycles;
}

const importsFrom = (dir: string, banned: string[]) =>
  files.filter((f) => f.startsWith(dir)).flatMap((f) => graph[f].filter((d) => banned.some((b) => d.startsWith(b))).map((d) => `${f} -> ${d}`));

describe('architecture', () => {
  it('finds the source files', () => expect(files.length).toBeGreaterThan(20));
  it('has no import loops', () => expect(findCycles()).toEqual([]));
  it('components do not import pages', () => expect(importsFrom('./components/', ['./pages/'])).toEqual([]));
  it('the store does not import screens', () => expect(importsFrom('./store/', ['./pages/', './components/'])).toEqual([]));
  it('lib does not import screens', () => expect(importsFrom('./lib/', ['./pages/', './components/'])).toEqual([]));
});
