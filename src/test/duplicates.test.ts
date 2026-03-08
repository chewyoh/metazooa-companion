import { describe, it, expect } from 'vitest';
import { battalions } from '@/data/idfUnits';

describe('No duplicate units', () => {
  it('should have no duplicate IDs', () => {
    const ids = battalions.map(b => b.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('should have no duplicate name+brigade combinations', () => {
    const keys = battalions.map(b => `${b.name}|${b.brigade}`);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dupes).toEqual([]);
  });

  it('should have no duplicate number+brigade combinations', () => {
    const keys = battalions.map(b => `${b.number}|${b.brigade}`);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dupes).toEqual([]);
  });
});
