import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = join(__dirname, '..', 'audit-ios-bundle.mjs');

function run(dir: string): { status: number; output: string } {
  try {
    const output = execFileSync(process.execPath, [script, dir], { encoding: 'utf8' });
    return { status: 0, output };
  } catch (error) {
    const failed = error as { status?: number; stdout?: string; stderr?: string };
    return {
      status: failed.status ?? 1,
      output: `${failed.stdout ?? ''}${failed.stderr ?? ''}`,
    };
  }
}

describe('iOS bundle audit', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'gate-runner-bundle-'));
    mkdirSync(join(dir, 'js'), { recursive: true });
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('fails when the bundle still contains the three CJS deprecation', () => {
    writeFileSync(
      join(dir, 'js', 'App.js'),
      'function boot(){ process.emitWarning("THREE_CJS_DEPRECATED"); }',
    );
    const result = run(dir);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('process.emitWarning');
  });

  it('passes a bundle that never calls process.emitWarning', () => {
    writeFileSync(join(dir, 'js', 'App.js'), 'export function boot(){ return "three.module.js"; }');
    const result = run(dir);
    expect(result.status).toBe(0);
  });
});
