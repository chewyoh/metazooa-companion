import { describe, it, expect } from 'vitest';
import { battalions } from '@/data/idfUnits';

describe('Wiki link coverage', () => {
  it('lists all unique brigade keys', () => {
    const keys = new Set<string>();
    for (const b of battalions) {
      keys.add(`${b.brigade} (${b.brigadeNumber})`);
    }
    console.log('All brigade keys:');
    for (const k of [...keys].sort()) {
      console.log(k);
    }
    expect(keys.size).toBeGreaterThan(0);
  });
});
