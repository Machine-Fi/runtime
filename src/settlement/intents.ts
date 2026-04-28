import { createHash, randomUUID } from 'node:crypto';
import type { SettlementIntent, RuntimeChain } from '../adapters/shared/types.js';
import { normalizeDecimalAmount, decimalToBaseUnits } from './amounts.js';
import { decimalsForSettlement } from './policy-limits.js';
import { assertEvmAddress } from '../adapters/robinhood/validation.js';
import { assertSolanaAddress } from '../adapters/solana/validation.js';

export interface BuildSettlementIntentInput {
  chain: RuntimeChain;
  source: string;
  recipient: string;
  amount: string;
  asset?: string | undefined;
  machineId: string;
  sessionId: string;
  policyId: string;
  memo?: string | undefined;
  reference?: string | undefined;
  nonce?: string | undefined;
  expiresAt?: string | undefined;
  now?: string | undefined;
  metadata?: Record<string, string | number | boolean>;
}

export const normalizeAmount = normalizeDecimalAmount;

function validateRailAssetAmount(chain: RuntimeChain, asset: string, amount: string): string {
  const normalized = normalizeDecimalAmount(amount);
  decimalToBaseUnits(normalized, decimalsForSettlement(chain, asset));
  return normalized;
}

function assertRailAddress(chain: RuntimeChain, value: string, label: string): void {
  if (chain === 'robinhood') assertEvmAddress(value, label);
  else assertSolanaAddress(value, label);
}

export function buildSettlementIntent(input: BuildSettlementIntentInput): SettlementIntent {
  assertRailAddress(input.chain, input.source, 'source');
  assertRailAddress(input.chain, input.recipient, 'recipient');
  const asset = input.asset ?? (input.chain === 'robinhood' ? 'ETH' : 'SOL');
  const amount = validateRailAssetAmount(input.chain, asset, input.amount);
  if (!input.machineId.trim()) throw new Error('machineId is required');
  if (!input.sessionId.trim()) throw new Error('sessionId is required');
  if (!input.policyId.trim()) throw new Error('policyId is required');
  const nonce = input.nonce ?? randomUUID();
  const createdAt = input.now ?? new Date().toISOString();
  const idSeed = [input.chain, input.source, input.recipient, amount, asset, input.machineId, input.sessionId, input.policyId, nonce].join('|');
  const intentId = `intent_${createHash('sha256').update(idSeed).digest('hex').slice(0, 24)}`;
  return {
    intentId,
    chain: input.chain,
    source: input.source,
    recipient: input.recipient,
    asset,
    amount,
    machineId: input.machineId,
    sessionId: input.sessionId,
    policyId: input.policyId,
    ...(input.memo ? { memo: input.memo } : {}),
    ...(input.reference ? { reference: input.reference } : {}),
    nonce,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
    createdAt,
    signingMode: 'caller-wallet',
    broadcast: false,
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
}
