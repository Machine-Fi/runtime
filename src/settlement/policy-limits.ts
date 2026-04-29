import type { RuntimeChain } from '../adapters/shared/types.js';
import { decimalAmountGt, decimalAmountLte, decimalToBaseUnits } from './amounts.js';

export interface SettlementAmountLimit {
  chain: RuntimeChain;
  asset: string;
  amount: string;
  maxAmount: string;
  decimals?: number | undefined;
}

export interface SettlementAmountDecision {
  accepted: boolean;
  amountBaseUnits?: string | undefined;
  maxBaseUnits?: string | undefined;
  decimals: number;
  reasons: string[];
}

export function decimalsForSettlement(chain: RuntimeChain, asset?: string): number {
  if (chain === 'solana') return asset === 'USDC' ? 6 : 9;
  return asset === 'USDC' ? 6 : 18;
}

