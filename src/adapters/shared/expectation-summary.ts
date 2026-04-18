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
  if (expectation.to || expectation.recipient) names.push('to');
  if (expectation.amount) names.push('amount');
  if (expectation.memo) names.push('memo');
  if (expectation.machineId) names.push('machineId');
  if (expectation.sessionId) names.push('sessionId');
  return names;
}

function canonicalFieldName(field: string): string {
  if (field === 'accountInvolvement') return 'accountInvolvement';
  if (field === 'recipient') return 'to';
  return field;
}

function fieldSummary(name: string, evidenceFields: ReceiptEvidenceField[]): FieldEvidenceSummary {
  const evidence = evidenceFields.find((field) => canonicalFieldName(field.field) === name);
  if (!evidence) return { field: name, expected: true, observed: false, matched: false, source: 'missing', native: false, envelope: false, unavailable: true };
  const source = evidence.source;
  return {
    field: name,
    expected: true,
    observed: source !== 'unavailable',
    matched: evidence.matched !== false,
    source,
    native: nativeSources.has(source),
    envelope: envelopeSources.has(source),
    unavailable: source === 'unavailable',
    detail: evidence.detail
  };
}

export function summarizeReceiptExpectationEvidence(expectation: ReceiptExpectation, evidenceFields: ReceiptEvidenceField[]): ReceiptExpectationSummary {
  const names = expectedReceiptFieldNames(expectation);
