import { describe, expect, it } from 'vitest';
import { makeBackup, parseBackup } from './backup';
import { toCSV } from './exporting';
import { buildSeed, USERS } from '../mock-data/seed';

const ME = USERS[0].id;
const backup = () => {
  const { projects, clients } = buildSeed();
  return makeBackup({ projects, clients, people: USERS, read: { a: true } }, '2026-10-31T00:00:00.000Z');
};

describe('backup', () => {
  it('survives a round trip', () => {
    const b = backup();
    expect(parseBackup(JSON.stringify(b), ME)).toEqual(JSON.parse(JSON.stringify(b)));
  });
  it('rejects text that is not JSON', () => expect(() => parseBackup('nope', ME)).toThrow(/could not be read/));
  it('rejects other JSON files', () => expect(() => parseBackup('{"a":1}', ME)).toThrow(/not an EngTrack backup/));
  it('rejects another version', () => expect(() => parseBackup(JSON.stringify({ ...backup(), version: 2 }), ME)).toThrow(/different version/));
  it('rejects a missing list', () => {
    const { clients: _, ...rest } = backup();
    expect(() => parseBackup(JSON.stringify(rest), ME)).toThrow(/clients/);
  });
  it('rejects a damaged project', () => {
    const b = backup();
    const [first, ...others] = b.projects;
    const { scopes: _, ...broken } = first;
    expect(() => parseBackup(JSON.stringify({ ...b, projects: [broken, ...others] }), ME)).toThrow(/scopes/);
  });
  it('rejects duplicate ids', () => {
    const b = backup();
    expect(() => parseBackup(JSON.stringify({ ...b, clients: [b.clients[0], b.clients[0]] }), ME)).toThrow(/twice/);
  });
  it('rejects a backup without the signed-in person', () => expect(() => parseBackup(JSON.stringify(backup()), 'someone-else')).toThrow(/your own entry/));
});

describe('CSV export', () => {
  const body = (cell: string | number) => toCSV(['h'], [[cell]]).split('\r\n')[1];
  it('neutralises spreadsheet formulas in text', () => {
    expect(body('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`);
    for (const start of ['+1', '-1', '@a']) expect(body(start)).toBe(`'${start}`);
  });
  it('leaves real numbers and ordinary text alone', () => {
    expect(body(-5)).toBe('-5');
    expect(body('CRM-2026-0142')).toBe('CRM-2026-0142');
  });
  it('quotes commas, quotes and both kinds of line break', () => {
    expect(body('a,b')).toBe('"a,b"');
    expect(body('a"b')).toBe('"a""b"');
    expect(toCSV(['h'], [['a\rb']])).toContain('"a\rb"');
  });
});
