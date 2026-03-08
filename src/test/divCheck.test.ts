import { describe, it } from 'vitest';
import { battalions } from '@/data/idfUnits';

describe('Division keys', () => {
  it('lists all unique division keys', () => {
    const keys = new Set<string>();
    for (const b of battalions) {
      keys.add(`${b.division} (${b.divisionNumber})`);
    }
    for (const k of [...keys].sort()) {
      console.log(k);
    }
  });
});
