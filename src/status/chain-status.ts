import type { ChainStatusResult, RuntimeChain } from '../adapters/shared/types.js';
import { ROBINHOOD_CHAIN_ID } from '../adapters/robinhood/chain.js';
import { createRobinhoodTransport, robinhoodRpcUrl } from '../adapters/robinhood/provider.js';
import { createSolanaTransport, solanaRpcUrl } from '../adapters/solana/provider.js';

const nowMs = () => Date.now();
export async function checkChainStatus(input: { chain: RuntimeChain; fixture?: boolean | undefined; rpcUrl?: string | undefined; timeoutMs?: number | undefined } ): Promise<ChainStatusResult> {
  const started = nowMs();
  if (input.fixture) {
    return { ok: true, mode: 'fixture', chain: input.chain, chainMatched: true, rpcReachable: true, latencyMs: 0, details: input.chain === 'robinhood' ? { chainId: `0x${ROBINHOOD_CHAIN_ID.toString(16)}`, rpcUrl: 'fixture' } : { version: 'fixture-solana-1.18', rpcUrl: 'fixture' } };
  }
  try {
    if (input.chain === 'robinhood') {
      const transport = createRobinhoodTransport({ rpcUrl: input.rpcUrl ?? robinhoodRpcUrl(), timeoutMs: input.timeoutMs });
      const chainId = await transport.request<string>('eth_chainId', []);
      const chainMatched = Number.parseInt(chainId, 16) === ROBINHOOD_CHAIN_ID;
      return { ok: chainMatched, mode: 'live-read', chain: 'robinhood', chainMatched, rpcReachable: true, latencyMs: nowMs() - started, details: { chainId } };
    }
    const transport = createSolanaTransport({ rpcUrl: input.rpcUrl ?? solanaRpcUrl(), timeoutMs: input.timeoutMs });
    const version = await transport.request<{ 'solana-core'?: string; 'feature-set'?: number }>('getVersion', []);
    return { ok: true, mode: 'live-read', chain: 'solana', chainMatched: false, rpcReachable: true, latencyMs: nowMs() - started, details: { version, networkVerification: 'unavailable', reason: 'Solana getVersion proves RPC reachability but does not identify mainnet/devnet/testnet/private cluster' } };
  } catch (cause) {
    return { ok: false, mode: 'live-read', chain: input.chain, chainMatched: false, rpcReachable: false, latencyMs: nowMs() - started, details: {}, error: cause instanceof Error ? cause.message : 'status check failed' };
  }
}
