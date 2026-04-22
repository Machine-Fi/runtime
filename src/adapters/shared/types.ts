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
