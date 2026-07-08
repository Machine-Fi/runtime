import { afterEach, describe, expect, it } from 'vitest';
import http from 'node:http';
import { verifyRobinhoodReceipt } from '../src/adapters/robinhood/receipts.js';
import { verifySolanaReceipt } from '../src/adapters/solana/receipts.js';
import { buildSettlementIntent } from '../src/settlement/intents.js';
import { buildSolanaSettlementIntent } from '../src/adapters/solana/settlement-intents.js';
import { buildRobinhoodSettlementIntent } from '../src/adapters/robinhood/settlement-intents.js';
import { createMachineJob } from '../src/jobs/lifecycle.js';
import { evaluateMachineJobPolicy } from '../src/jobs/policy.js';
import { normalizeTelemetrySnapshot, telemetryIsUsable } from '../src/telemetry/snapshot.js';
import type { MachineIdentity } from '../src/machines/identity.js';
import type { MachineJobPolicy } from '../src/jobs/policy.js';

let server: http.Server | undefined;
afterEach(() => server?.close());
const txHash = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const sig = '5HueCGU8rMjxEXxiPuD5BDuRaRj1hUXQG48GhYnjmQumooWcT3Yr4v7e1i4bnzK7t1Q7Fxx4E2VPu7Y9xV1r5fq';
const fromEvm = '0x1111111111111111111111111111111111111111';
const toEvm = '0x2222222222222222222222222222222222222222';
const fromSol = '11111111111111111111111111111111';
const toSol = 'Sysvar1111111111111111111111111111111111111';

function rpc(handler: (method: string, params: unknown[]) => unknown): Promise<string> {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => body += chunk);
      req.on('end', () => {
        const parsed = JSON.parse(body);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', id: parsed.id ?? 1, result: handler(parsed.method, parsed.params ?? []) }));
      });
    }).listen(0, '127.0.0.1', () => {
      const address = server!.address();
      if (typeof address === 'object' && address) resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function solanaTx(preBalances: Array<string | number>, postBalances: Array<string | number>, logs: string[] = []) {
  return { slot: 44, meta: { err: null, preBalances, postBalances, logMessages: logs }, transaction: { message: { accountKeys: [fromSol, toSol] } } };
}

describe('Robinhood verification hardening', () => {
  it('does not verify before requested live confirmations are reached', async () => {
    const url = await rpc((method) => method === 'eth_chainId' ? '0x1237' : method === 'eth_getTransactionReceipt' ? { transactionHash: txHash, status: '0x1', blockNumber: '0x20', from: fromEvm, to: toEvm, logs: [] } : method === 'eth_getTransactionByHash' ? { hash: txHash, from: fromEvm, to: toEvm, value: '0x1158e460913d00000' } : method === 'eth_blockNumber' ? '0x20' : null);
    const result = await verifyRobinhoodReceipt(txHash, { rpcUrl: url, minConfirmations: 3, expectation: { from: fromEvm, to: toEvm, amount: '20' } });
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.value.found).toBe(true);
    expect(result.value.status).toBe('success');
    expect(result.value.verified).toBe(false);
    expect(result.value.confirmations).toBe(1);
    expect(result.value.mismatchReasons?.join(' ')).toContain('minimum confirmations not reached');
  });

  it('verifies when requested live confirmations are reached', async () => {
    const url = await rpc((method) => method === 'eth_chainId' ? '0x1237' : method === 'eth_getTransactionReceipt' ? { transactionHash: txHash, status: '0x1', blockNumber: '0x20', from: fromEvm, to: toEvm, logs: [] } : method === 'eth_getTransactionByHash' ? { hash: txHash, from: fromEvm, to: toEvm, value: '0x1158e460913d00000' } : method === 'eth_blockNumber' ? '0x22' : null);
    const result = await verifyRobinhoodReceipt(txHash, { rpcUrl: url, minConfirmations: 3, expectation: { from: fromEvm, to: toEvm, amount: '20' } });
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.value.verified).toBe(true);
    expect(result.value.confirmations).toBe(3);
  });

  it('surfaces finalized EVM finality when current block is far enough ahead', async () => {
    const url = await rpc((method) => method === 'eth_chainId' ? '0x1237' : method === 'eth_getTransactionReceipt' ? { transactionHash: txHash, status: '0x1', blockNumber: '0x20', from: fromEvm, to: toEvm, logs: [] } : method === 'eth_getTransactionByHash' ? { hash: txHash, from: fromEvm, to: toEvm, value: '0x1158e460913d00000' } : method === 'eth_blockNumber' ? '0x70' : null);
    const result = await verifyRobinhoodReceipt(txHash, { rpcUrl: url, minConfirmations: 3, expectation: { amount: '20' } });
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.value.verified).toBe(true);
    expect(result.value.finality).toBe('finalized');
  });

  it('enforces fixture minConfirmations without inventing live depth', async () => {
    const result = await verifyRobinhoodReceipt(txHash, { fixture: true, minConfirmations: 2, expectation: { amount: '1.25' } });
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.value.verified).toBe(false);
