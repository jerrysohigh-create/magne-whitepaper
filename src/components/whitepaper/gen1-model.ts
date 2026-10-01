export const GEN1_BASELINE = 13_750;
export function calculateGen1(counts: number[], availability: number, work: number, startMonth = 1) {
  if (!Number.isInteger(startMonth) || startMonth < 1 || startMonth > counts.length || ![24, 36].includes(counts.length) || counts.some(n => !Number.isSafeInteger(n) || n < 0 || n > 1e9) ||
      !Number.isFinite(availability) || !Number.isFinite(work) || availability < 0 || availability > 1 || work < 0 || work > availability) {
    throw new Error('Invalid scenario');
  }
  let earnedTotal = 0, releasedTotal = 0;
  const earned: number[] = [];
  return Array.from({ length: counts.length + 2 }, (_, i) => {
    const tail = i >= counts.length;
    const count = tail ? 0 : counts[i];
    const budget = 200_000_000 / 2 ** Math.floor(i / 12) / 12 * (i === 0 ? 0.2 : i === 1 ? 0.6 : 1);
    const participating = !tail && i + 1 >= startMonth && count > 0;
    const reward = !participating ? 0 : Math.min(budget / Math.max(count, GEN1_BASELINE), 10_000) * (0.2 * availability + 0.8 * work);
    earned.push(reward);
    const released = 0.6 * reward + 0.2 * (earned[i - 1] ?? 0) + 0.2 * (earned[i - 2] ?? 0);
    earnedTotal += reward; releasedTotal += released;
    return { month: i + 1, count, tail, participating, earned: reward, released, earnedTotal, releasedTotal, locked: Math.max(0, earnedTotal - releasedTotal) };
  });
}
