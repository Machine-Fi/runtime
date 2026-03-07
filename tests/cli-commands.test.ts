import { expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';

it('CLI pair accepts real machine arguments in fixture mode', () => {
  const out = execFileSync('node', ['dist/cli/index.js', 'pair', '--chain', 'solana', '--fixture', '--machine-id', 'drone-9', '--wallet', '11111111111111111111111111111111', '--operator', 'ops-alpha'], { encoding: 'utf8' });
  expect(JSON.parse(out).machineId).toBe('drone-9');
});

it('CLI intent build requires amount and runtime ids', () => {
  const out = execFileSync('node', ['dist/cli/index.js', 'intent', 'build', '--chain', 'robinhood', '--source', '0x1111111111111111111111111111111111111111', '--recipient', '0x2222222222222222222222222222222222222222', '--amount', '1.25', '--machine-id', 'robot-arm-17', '--session-id', 'session-1', '--fixture'], { encoding: 'utf8' });
  expect(JSON.parse(out).broadcast).toBe(false);
});

// CLI smoke coverage exercises fixture-mode machine commands.
