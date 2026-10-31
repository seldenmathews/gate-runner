import { LEVEL_COUNT, levelNumber } from '../levels';
import { applyRun, initialProgress, parseProgress, type Progress } from './progress-model';
import { getItem, setItem } from './storage';

const KEY = 'gaterunner.progress.v1';

export async function loadProgress(): Promise<Progress> {
  try {
    return parseProgress(await getItem(KEY));
  } catch {
    return initialProgress();
  }
}

export async function recordRun(levelId: string, score: number, won: boolean): Promise<Progress> {
  const current = await loadProgress();
  const number = levelNumber(levelId);
  const next = number > 0 ? applyRun(current, number, LEVEL_COUNT, score, won) : current;
  try {
    await setItem(KEY, JSON.stringify(next));
  } catch {
    // The returned progress still unlocks the next level for this session.
  }
  return next;
}

export type { Progress };
