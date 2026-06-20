import { expect, it } from 'vitest';
import { createMachineSession, deriveSessionId, validateWalletForRail } from '../src/sessions/session.js';

it('creates deterministic fixture sessions from machine, operator, policy, and nonce', () => {
  const session = createMachineSession({ chain: 'solana', walletAddress: '11111111111111111111111111111111', machineId: 'drone-9', operatorId: 'ops-alpha', policyProfileId: 'field-policy', mode: 'fixture', nonce: 'fixed', now: '2026-07-14T00:00:00Z', metadata: { role: 'drone', capabilities: ['inspection'] } });
  expect(session.sessionId).toBe(deriveSessionId({ chain: 'solana', walletAddress: '11111111111111111111111111111111', machineId: 'drone-9', operatorId: 'ops-alpha', policyProfileId: 'field-policy', nonce: 'fixed', createdAt: '2026-07-14T00:00:00Z' }));
  expect(session.metadata?.role).toBe('drone');
});

it('rejects malformed rail-specific wallets', () => {
  expect(() => validateWalletForRail('robinhood', 'not-an-address')).toThrow(/invalid Robinhood/);
  expect(() => validateWalletForRail('solana', '0x1111111111111111111111111111111111111111')).toThrow(/invalid Solana/);
});

it('requires non-empty machine and operator ids', () => {
  expect(() => createMachineSession({ chain: 'robinhood', walletAddress: '0x1111111111111111111111111111111111111111', machineId: '', operatorId: 'ops' })).toThrow(/machineId/);
});
