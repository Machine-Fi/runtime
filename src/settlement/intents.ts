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
