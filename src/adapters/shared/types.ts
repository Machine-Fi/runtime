export type RuntimeChain = 'robinhood' | 'solana';
export type RuntimeMode = 'fixture' | 'live-read';
import type { ReceiptEvidenceField, SettlementEvidence } from './evidence.js';
export type MachineRole = 'robot' | 'drone' | 'sensor' | 'edge-node' | 'vehicle' | 'other';

export interface MachineMetadata {
  role?: MachineRole | undefined;
  capabilities?: string[] | undefined;
  locationHint?: string | undefined;
  model?: string | undefined;
}

export interface MachineSession {
  sessionId: string;
  chain: RuntimeChain;
  walletAddress: string;
  machineId: string;
  machineLabel?: string | undefined;
  operatorId: string;
  policyProfileId: string;
  createdAt: string;
  updatedAt: string;
  mode: RuntimeMode;
  nonce: string;
  metadata?: MachineMetadata | undefined;
}

export interface ProviderConfig { chain: RuntimeChain; rpcUrl?: string | undefined; fixture?: boolean | undefined; timeoutMs?: number | undefined; }

export interface ReceiptExpectation {
  status?: 'success' | 'failed' | 'pending' | undefined;
  from?: string | undefined;
  to?: string | undefined;
  recipient?: string | undefined;
  amount?: string | undefined;
  asset?: string | undefined;
  memo?: string | undefined;
  sessionId?: string | undefined;
  machineId?: string | undefined;
}

export interface ReceiptVerification {
  chain: RuntimeChain;
  id: string;
  found: boolean;
  verified?: boolean | undefined;
  chainMatched?: boolean | undefined;
  status: 'success' | 'failed' | 'pending' | 'not_found';
  statusMatched?: boolean | undefined;
  expectationsMatched?: boolean | undefined;
  mismatchReasons?: string[] | undefined;
  finality?: 'finalized' | 'confirmed' | 'processed' | 'pending' | 'unknown' | undefined;
  confirmations?: number | undefined;
  block?: string | number | undefined;
  explorerUrl?: string | undefined;
  raw?: unknown;
  evidence?: ReceiptEvidenceField[] | undefined;
  settlementEvidence?: SettlementEvidence | undefined;
}

