import type { ReceiptExpectation } from './types.js';
import type { EvidenceSource, ReceiptEvidenceField } from './evidence.js';

export interface FieldEvidenceSummary {
  field: string;
  expected: boolean;
  observed: boolean;
  matched: boolean;
  source: EvidenceSource | 'missing';
  native: boolean;
  envelope: boolean;
  unavailable: boolean;
  detail?: string | undefined;
}

export interface ReceiptExpectationSummary {
  matched: boolean;
  unavailableFields: string[];
  mismatchedFields: string[];
  nativeFields: string[];
  envelopeFields: string[];
  fixtureFields: string[];
  fieldSummaries: FieldEvidenceSummary[];
}

const nativeSources = new Set<EvidenceSource>(['native_receipt', 'transaction', 'log_event', 'memo_log', 'balance_delta']);
const envelopeSources = new Set<EvidenceSource>(['machinefi_envelope']);
const fixtureSources = new Set<EvidenceSource>(['fixture']);

export function expectedReceiptFieldNames(expectation: ReceiptExpectation = {}): string[] {
  const names: string[] = [];
  if (expectation.status) names.push('status');
  if (expectation.from) names.push('from');
