import { describe, expect, it } from 'vitest';
import { verifyRobinhoodReceipt } from '../src/adapters/robinhood/receipts.js';
import { verifySolanaReceipt } from '../src/adapters/solana/receipts.js';
import { LiveRpcTransport } from '../src/transports/live-rpc.js';

it('marks Robinhood missing expected fields as unavailable mismatches', async () => {
  const result = await verifyRobinhoodReceipt('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', { fixture: true, expectation: { amount: '9', machineId: 'missing-machine', sessionId: 'missing-session', memo: 'missing-memo' } });
  expect(result.ok).toBe(true); if (!result.ok) return;
  expect(result.value.verified).toBe(false);
  expect(result.value.expectationsMatched).toBe(false);
  expect(result.value.mismatchReasons).toEqual(expect.arrayContaining(['amount mismatch', 'machine id mismatch', 'session id mismatch', 'memo mismatch']));
});
it('marks Solana missing expected fields as unavailable mismatches', async () => {
  const result = await verifySolanaReceipt('5HueCGU8rMjxEXxiPuD5BDuRaRj1hUXQG48GhYnjmQumooWcT3Yr4v7e1i4bnzK7t1Q7Fxx4E2VPu7Y9xV1r5fq', { fixture: true, expectation: { amount: '0.7', memo: 'missing', machineId: 'drone-9', sessionId: 'missing-session' } });
  expect(result.ok).toBe(true); if (!result.ok) return;
  expect(result.value.verified).toBe(false);
  expect(result.value.mismatchReasons).toEqual(expect.arrayContaining(['amount mismatch', 'memo mismatch', 'session id mismatch']));
});
it('throws on malformed JSON-RPC responses without result', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1 }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;
  await expect(new LiveRpcTransport('https://example.invalid').request('eth_chainId')).rejects.toThrow(/malformed JSON-RPC response/);
  globalThis.fetch = original;
});
it('throws JSON-RPC error messages', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'provider failed' } }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;
  await expect(new LiveRpcTransport('https://example.invalid').request('eth_chainId')).rejects.toThrow(/provider failed/);
  globalThis.fetch = original;
});
