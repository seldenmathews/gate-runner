export interface Progress {
  version: 1;
  unlockedThrough: number;
  bestScores: Record<string, number>;
  cleared: Record<string, boolean>;
}

export function initialProgress(): Progress {
  return { version: 1, unlockedThrough: 1, bestScores: {}, cleared: {} };
}

export function applyRun(
  progress: Progress,
  levelNumber: number,
  levelCount: number,
  score: number,
  won: boolean,
): Progress {
  const id = String(levelNumber);
  const previous = progress.bestScores[id] ?? 0;
  return {
    version: 1,
    unlockedThrough: won
      ? Math.min(levelCount, Math.max(progress.unlockedThrough, levelNumber + 1))
      : progress.unlockedThrough,
    bestScores: { ...progress.bestScores, [id]: Math.max(previous, Math.round(score)) },
    cleared: won ? { ...progress.cleared, [id]: true } : { ...progress.cleared },
  };
}

export function isLevelUnlocked(progress: Progress, levelNumber: number): boolean {
  return levelNumber >= 1 && levelNumber <= progress.unlockedThrough;
}

export function parseProgress(raw: string | null): Progress {
  if (!raw) return initialProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return initialProgress();
    const record = value as Record<string, unknown>;
    const unlocked =
      typeof record.unlockedThrough === 'number' && Number.isFinite(record.unlockedThrough)
        ? Math.max(1, Math.min(99, Math.floor(record.unlockedThrough)))
        : 1;
    const bestScores: Record<string, number> = {};
    if (typeof record.bestScores === 'object' && record.bestScores !== null) {
      for (const [key, score] of Object.entries(record.bestScores)) {
        if (typeof score === 'number' && Number.isFinite(score)) bestScores[key] = score;
      }
    }
    const cleared: Record<string, boolean> = {};
    if (typeof record.cleared === 'object' && record.cleared !== null) {
      for (const [key, flag] of Object.entries(record.cleared)) {
        if (flag === true) cleared[key] = true;
      }
    }
    return { version: 1, unlockedThrough: unlocked, bestScores, cleared };
  } catch {
    return initialProgress();
  }
}
