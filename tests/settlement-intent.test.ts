import { expect, it } from 'vitest';
import { buildSettlementIntent, normalizeAmount } from '../src/settlement/intents.js';
import { assertSettlementIntent } from '../src/schemas/settlement-intent.js';

it('builds unsigned caller-wallet settlement intents with runtime fields', () => {
  const intent = buildSettlementIntent({ chain: 'robinhood', source: '0x1111111111111111111111111111111111111111', recipient: '0x2222222222222222222222222222222222222222', amount: '1.25', asset: 'ETH', machineId: 'robot-arm-17', sessionId: 'session-1', policyId: 'standard-machine-policy', nonce: 'fixed', now: '2026-07-14T00:00:00Z' });
  expect(intent.intentId).toMatch(/^intent_/);
  expect(intent.broadcast).toBe(false);
  expect(assertSettlementIntent(intent)).toEqual(intent);
});

it('rejects zero and negative amounts', () => {
  expect(() => normalizeAmount('0')).toThrow(/greater than zero/);
  expect(() => normalizeAmount('-1')).toThrow(/positive decimal/);
});

it('rejects malformed recipient addresses', () => {
  expect(() => buildSettlementIntent({ chain: 'solana', source: '11111111111111111111111111111111', recipient: 'bad', amount: '1', machineId: 'm', sessionId: 's', policyId: 'p' })).toThrow(/invalid Solana recipient/);
});
