export type ChainFinality = 'finalized' | 'confirmed' | 'processed' | 'pending' | 'unknown';

export interface ConfirmationDerivation {
  confirmations: number;
  finality: ChainFinality;
  currentBlock?: string | undefined;
  receiptBlock?: string | undefined;
  reason?: string | undefined;
}

export function parseHexQuantity(value: string, fieldName = 'hex quantity'): bigint {
  if (!/^0x[0-9a-fA-F]+$/.test(value)) throw new Error(`invalid ${fieldName}`);
  return BigInt(value);
}

export function deriveEvmConfirmations(input: { receiptBlock?: string | undefined; currentBlock?: string | undefined; minimumFinalized?: number | undefined; }): ConfirmationDerivation {
  if (!input.receiptBlock) return { confirmations: 0, finality: 'pending', reason: 'receipt block unavailable' };
  if (!input.currentBlock) return { confirmations: 0, finality: 'pending', receiptBlock: input.receiptBlock, reason: 'current block unavailable' };
  const receipt = parseHexQuantity(input.receiptBlock, 'receipt block');
  const current = parseHexQuantity(input.currentBlock, 'current block');
  if (current < receipt) return { confirmations: 0, finality: 'pending', currentBlock: input.currentBlock, receiptBlock: input.receiptBlock, reason: 'current block precedes receipt block' };
  const confirmations = Number(current - receipt + 1n);
  const minimumFinalized = input.minimumFinalized ?? 64;
  return { confirmations, finality: confirmations >= minimumFinalized ? 'finalized' : confirmations > 0 ? 'confirmed' : 'pending', currentBlock: input.currentBlock, receiptBlock: input.receiptBlock };
}

export function normalizeSolanaFinality(status?: 'processed' | 'confirmed' | 'finalized' | null, hasTransaction = false): ChainFinality {
  if (status === 'finalized' || status === 'confirmed' || status === 'processed') return status;
  return hasTransaction ? 'confirmed' : 'pending';
}

export function finalityMeetsMinimum(finality: ChainFinality, minimum: ChainFinality): boolean {
  const rank: Record<ChainFinality, number> = { pending: 0, unknown: 0, processed: 1, confirmed: 2, finalized: 3 };
  return rank[finality] >= rank[minimum];
}
