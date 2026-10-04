// Evolution stages and the EP where each one starts (see workprogress.md).
export const STAGES = [
  { name: 'Spark',    minEP: 0 },
  { name: 'Awakened', minEP: 1000 },
  { name: 'Ascender', minEP: 3000 },
  { name: 'Guardian', minEP: 6000 },
  { name: 'Titan',    minEP: 11000 },
  { name: 'Apex',     minEP: 18000 },
  { name: 'Legend',   minEP: 28000 },
];

// Where the user sits inside their current stage.
export function stageInfo(stageName, ep = 0) {
  let index = STAGES.findIndex(s => s.name === stageName);
  if (index < 0) {
    // Unknown name from the server: derive the stage from EP instead.
    index = STAGES.reduce((acc, s, i) => (ep >= s.minEP ? i : acc), 0);
  }
  const current = STAGES[index];
  const next = STAGES[index + 1] || null;
  const span = next ? next.minEP - current.minEP : 1;
  const progress = next ? Math.max(0, Math.min((ep - current.minEP) / span, 1)) : 1;
  return {
    name: current.name,
    number: index + 1,
    total: STAGES.length,
    next,
    progress,
    epToNext: next ? Math.max(next.minEP - ep, 0) : 0,
    nextMin: next ? next.minEP : current.minEP,
  };
}
