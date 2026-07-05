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

export function deriveSessionId(input: Pick<CreateMachineSessionInput, 'chain' | 'walletAddress' | 'machineId' | 'operatorId'> & { policyProfileId: string; nonce: string; createdAt: string }): string {
  const seed = [input.chain, input.walletAddress, input.machineId, input.operatorId, input.policyProfileId, input.nonce, input.createdAt].join('|');
  return `mfi_${input.chain}_${createHash('sha256').update(seed).digest('hex').slice(0, 24)}`;
}

export function createMachineSession(input: CreateMachineSessionInput): MachineSession {
  const chain = input.chain;
  const walletAddress = clean(input.walletAddress, 'walletAddress');
  validateWalletForRail(chain, walletAddress);
  const machineId = clean(input.machineId, 'machineId');
  const operatorId = clean(input.operatorId, 'operatorId');
  const policyProfileId = clean(input.policyProfileId ?? 'standard-machine-policy', 'policyProfileId');
  const nonce = input.nonce ?? (input.mode === 'fixture' ? `${machineId}:${operatorId}:fixture` : randomUUID());
  const createdAt = input.now ?? new Date().toISOString();
  const sessionId = deriveSessionId({ chain, walletAddress, machineId, operatorId, policyProfileId, nonce, createdAt });
  return {
    sessionId,
    chain,
    walletAddress,
    machineId,
    ...(input.machineLabel ? { machineLabel: input.machineLabel } : {}),
    operatorId,
    policyProfileId,
    createdAt,
    updatedAt: createdAt,
    mode: input.mode ?? 'live-read',
    nonce,
    ...(input.metadata ? { metadata: input.metadata } : {})
  };
}
