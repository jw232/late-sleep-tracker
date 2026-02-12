/**
 * Calculate consecutive recording days starting from today.
 * If today has no record, returns 0.
 */
export function calculateStreak(recordDates: string[]): number {
  const dates = new Set(recordDates);
  let count = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    if (dates.has(dateStr)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
