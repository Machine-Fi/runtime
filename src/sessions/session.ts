import { createHash, randomUUID } from 'node:crypto';
import type { MachineMetadata, MachineSession, RuntimeChain, RuntimeMode } from '../adapters/shared/types.js';
import { isEvmAddress } from '../adapters/robinhood/validation.js';
import { isSolanaAddress } from '../adapters/solana/validation.js';

export interface CreateMachineSessionInput {
  chain: RuntimeChain;
  walletAddress: string;
  machineId: string;
  operatorId: string;
  policyProfileId?: string | undefined;
  machineLabel?: string | undefined;
  mode?: RuntimeMode | undefined;
  nonce?: string | undefined;
  now?: string | undefined;
  metadata?: MachineMetadata | undefined;
}

const clean = (value: string, field: string): string => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  return trimmed;
};

export function validateWalletForRail(chain: RuntimeChain, walletAddress: string): void {
  if (chain === 'robinhood' && !isEvmAddress(walletAddress)) throw new Error('invalid Robinhood wallet address');
  if (chain === 'solana' && !isSolanaAddress(walletAddress)) throw new Error('invalid Solana wallet address');
}

