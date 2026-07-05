import { afterEach, describe, expect, it } from 'vitest';
import http from 'node:http';
import { verifyRobinhoodReceipt } from '../src/adapters/robinhood/receipts.js';
import { verifySolanaReceipt } from '../src/adapters/solana/receipts.js';
import { createMachineJob } from '../src/jobs/lifecycle.js';
import { evaluateMachineJobPolicy } from '../src/jobs/policy.js';
import { DEFAULT_POLICY_PROFILE, validatePolicyForIntent } from '../src/policy/profiles.js';
import { normalizeTelemetrySnapshot } from '../src/telemetry/snapshot.js';
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

function expectUnavailableFields(fields: unknown, names: string[]): void {
  const evidence = fields as Array<{ field: string; source: string; matched?: boolean }>;
  for (const name of names) {
    expect(evidence.find((field) => field.field === name || (name === 'to' && field.field === 'to'))).toMatchObject({ source: 'unavailable', matched: false });
  }
}

describe('depth polish fix pass receipt evidence', () => {
  it('marks truly absent Robinhood amount and metadata fields unavailable', async () => {
    const url = await rpc((method) => method === 'eth_chainId' ? '0x1237' : method === 'eth_getTransactionReceipt' ? { transactionHash: txHash, status: '0x1', blockNumber: '0x20', from: fromEvm, to: toEvm, logs: [] } : method === 'eth_blockNumber' ? '0x22' : null);
    const result = await verifyRobinhoodReceipt(txHash, { rpcUrl: url, expectation: { amount: '1.25', memo: 'job:missing', machineId: 'robot-missing', sessionId: 'session-missing' } });
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.value.verified).toBe(false);
    expectUnavailableFields(result.value.evidence, ['amount', 'memo', 'machineId', 'sessionId']);
    expect(result.value.mismatchReasons).toEqual(expect.arrayContaining(['expected amount unavailable in receipt', 'expected memo unavailable in receipt', 'expected machineId unavailable in receipt', 'expected sessionId unavailable in receipt']));
  });

  it('derives Robinhood live confirmations from current block height', async () => {
    const url = await rpc((method) => method === 'eth_chainId' ? '0x1237' : method === 'eth_getTransactionReceipt' ? { transactionHash: txHash, status: '0x1', blockNumber: '0x20', from: fromEvm, to: toEvm, logs: [] } : method === 'eth_getTransactionByHash' ? { hash: txHash, from: fromEvm, to: toEvm, value: '0x1158e460913d00000' } : method === 'eth_blockNumber' ? '0x24' : null);
    const result = await verifyRobinhoodReceipt(txHash, { rpcUrl: url, expectation: { from: fromEvm, to: toEvm, amount: '20' } });
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.value.verified).toBe(true);
