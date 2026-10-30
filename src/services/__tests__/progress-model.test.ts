import { applyRun, initialProgress, isLevelUnlocked, parseProgress } from '../progress-model';

describe('progress', () => {
  it('starts with level 1 unlocked and nothing cleared', () => {
    const progress = initialProgress();
    expect(isLevelUnlocked(progress, 1)).toBe(true);
    expect(isLevelUnlocked(progress, 2)).toBe(false);
  });

  it('unlocks the next level only after a win and keeps the best score', () => {
    const lost = applyRun(initialProgress(), 1, 3, 400, false);
    expect(lost.unlockedThrough).toBe(1);
    expect(lost.bestScores['1']).toBe(400);

    const won = applyRun(lost, 1, 3, 250, true);
    expect(won.unlockedThrough).toBe(2);
    expect(won.bestScores['1']).toBe(400);
    expect(won.cleared['1']).toBe(true);
    expect(isLevelUnlocked(won, 2)).toBe(true);
    expect(isLevelUnlocked(won, 3)).toBe(false);
  });

  it('does not unlock past the last level', () => {
    const progress = applyRun({ ...initialProgress(), unlockedThrough: 3 }, 3, 3, 900, true);
    expect(progress.unlockedThrough).toBe(3);
  });

  it('falls back when saved progress is junk', () => {
    expect(parseProgress(null)).toEqual(initialProgress());
    expect(parseProgress('not json')).toEqual(initialProgress());
    expect(
      parseProgress('{"unlockedThrough":2,"bestScores":{"1":10},"cleared":{"1":true}}'),
    ).toEqual({
      version: 1,
      unlockedThrough: 2,
      bestScores: { '1': 10 },
      cleared: { '1': true },
    });
  });
});
