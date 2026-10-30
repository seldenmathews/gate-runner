import level1 from '../../levels/level-1.json';
import level2 from '../../levels/level-2.json';
import level3 from '../../levels/level-3.json';
import { LEVELS } from '../../levels';
import { LevelParseError, parseLevel } from '../level';

describe('parseLevel', () => {
  it('parses the three shipped levels', () => {
    expect(LEVELS.map((level) => level.id)).toEqual(['1', '2', '3']);
    for (const level of LEVELS) {
      const seconds = level.length / level.speed + level.finale.duration;
      expect(seconds).toBeGreaterThanOrEqual(30);
      expect(seconds).toBeLessThanOrEqual(60);
      expect(level.gates.length % 2).toBe(0);
    }
  });

  it('accepts the raw level files', () => {
    expect(parseLevel(level1, 'level-1').name).toBe('Overpass Drill');
    expect(parseLevel(level2, 'level-2').finale.kind).toBe('boss');
    expect(parseLevel(level3, 'level-3').gates.some((gate) => gate.rigged)).toBe(true);
  });

  it('teaches the hack on level 1 with a single obvious rigged gate', () => {
    const level = parseLevel(level1, 'level-1');
    const rigged = level.gates.filter((gate) => gate.rigged);
    expect(rigged).toHaveLength(1);
    expect(rigged[0]?.op).toBe('sub');
    expect(level.banners.some((banner) => /glitch/i.test(banner.text))).toBe(true);
  });

  it('rejects a gate row that is not a left/right pair', () => {
    expect(() =>
      parseLevel({
        ...level1,
        gates: [level1.gates[0], { ...level1.gates[1], side: 'left' }],
      }),
    ).toThrow(LevelParseError);
  });

  it('rejects an unknown operator and a rigged gate with no hit threshold', () => {
    expect(() =>
      parseLevel({
        ...level1,
        gates: [{ ...level1.gates[0], op: 'pow' }, level1.gates[1]],
      }),
    ).toThrow(/add, sub, mul, div/);

    expect(() =>
      parseLevel({
        ...level1,
        gates: [{ ...level1.gates[0], rigged: true }, level1.gates[1]],
      }),
    ).toThrow(/hitsToFlip/);
  });

  it('rejects duplicate ids', () => {
    expect(() =>
      parseLevel({
        ...level1,
        pickups: [{ ...level1.pickups[0], id: level1.gates[0]?.id }],
      }),
    ).toThrow(/duplicate id/);
  });
});
