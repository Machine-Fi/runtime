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
