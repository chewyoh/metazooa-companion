import { describe, it } from 'vitest';
import { battalions } from '@/data/idfUnits';

describe('Brigades with only one battalion', () => {
  it('list them', () => {
    const countMap = new Map<string, number>();
    for (const b of battalions) {
      const key = `${b.brigade} (${b.brigadeNumber}) | ${b.division} | ${b.command}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    const singles = [...countMap.entries()]
      .filter(([, count]) => count === 1)
      .map(([key]) => key)
      .sort();
    
    console.log(`\n=== חטיבות עם גדוד אחד בלבד (${singles.length}) ===`);
    singles.forEach(s => console.log(`  - ${s}`));
    console.log('');
  });
});
