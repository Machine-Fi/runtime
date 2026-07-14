import { expect, it } from 'vitest';
import { checkChainStatus } from '../src/status/chain-status.js';
import { FixtureRpcTransport } from '../src/transports/fixture-rpc.js';

it('checks Robinhood chain identity in live-read status', async () => {
  const result = await checkChainStatus({ chain: 'robinhood', rpcUrl: 'fixture', fixture: false, timeoutMs: 100, ...{ } } as never);
  expect(result.chain).toBe('robinhood');
});

it('returns deterministic fixture health', async () => {
  const result = await checkChainStatus({ chain: 'solana', fixture: true });
  expect(result.ok).toBe(true);
  expect(result.mode).toBe('fixture');
});

it('fixture RPC transport returns missing methods', async () => {
  const transport = new FixtureRpcTransport({ eth_chainId: '0x1237' });
  await expect(transport.request('missing')).rejects.toThrow(/missing/);
});


it('reports Solana live-read reachability without claiming cluster identity from getVersion alone', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { 'solana-core': '1.18.0', 'feature-set': 123 } }), { status: 200, headers: { 'content-type': 'application/json' } })) as typeof fetch;
  const result = await checkChainStatus({ chain: 'solana', rpcUrl: 'https://example.invalid', timeoutMs: 100 });
  globalThis.fetch = original;
  expect(result.ok).toBe(true);
  expect(result.rpcReachable).toBe(true);
  expect(result.chainMatched).toBe(false);
  expect(result.details.networkVerification).toBe('unavailable');
});
