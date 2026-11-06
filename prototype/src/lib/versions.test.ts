import { describe, expect, it } from 'vitest';
import { differs, findConflicts, stamp, type Versions } from './versions';

const v = (entries: [string, number][]): Versions => new Map(entries);

describe('edits from another device', () => {
  it('reads database times written in either format as the same moment', () =>
    expect(stamp('2026-11-07T10:00:00.123Z')).toBe(stamp('2026-11-07T10:00:00.123+00:00')));

  it('allows saving a record nobody else touched, and a brand-new one', () =>
    expect(findConflicts(['a', 'new'], [], v([['a', 1]]), v([['a', 1]]))).toEqual([]));

  it('flags a record changed elsewhere since this device last saw it', () =>
    expect(findConflicts(['a'], [], v([['a', 1]]), v([['a', 2]]))).toEqual(['a']));

  it('flags a record deleted elsewhere, so editing it does not bring it back unasked', () =>
    expect(findConflicts(['a'], [], v([['a', 1]]), v([]))).toEqual(['a']));

  it('flags a new record whose id was already taken elsewhere (two devices, same project number)', () =>
    expect(findConflicts(['CRM-2026-0200'], [], v([]), v([['CRM-2026-0200', 5]]))).toEqual(['CRM-2026-0200']));

  it('flags removing a record that was changed elsewhere, but not one already removed', () => {
    expect(findConflicts([], ['a'], v([['a', 1]]), v([['a', 2]]))).toEqual(['a']);
    expect(findConflicts([], ['a'], v([['a', 1]]), v([]))).toEqual([]);
    expect(findConflicts([], ['a'], v([['a', 1]]), v([['a', 1]]))).toEqual([]);
  });

  it('notices any new, changed or removed record when comparing whole tables', () => {
    const known = v([['a', 1], ['b', 1]]);
    expect(differs(known, v([['a', 1], ['b', 1]]))).toBe(false);
    expect(differs(known, v([['a', 1], ['b', 2]]))).toBe(true);
    expect(differs(known, v([['a', 1]]))).toBe(true);
    expect(differs(known, v([['a', 1], ['b', 1], ['c', 1]]))).toBe(true);
    expect(differs(known, v([['a', 1], ['c', 1]]))).toBe(true);
  });
});
