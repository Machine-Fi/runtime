import { getFixtureReceipt } from '../../transports/fixture.js';
import { err, ok, type RuntimeResult } from '../shared/result.js';
import type { ReceiptExpectation, ReceiptVerification } from '../shared/types.js';
import { evidence, splitEvidence, type ReceiptEvidenceField } from '../shared/evidence.js';
import { deriveEvmConfirmations } from '../shared/finality.js';
import { baseUnitsEqualDecimal } from '../../settlement/amounts.js';
import { ROBINHOOD_CHAIN_ID, robinhoodTxUrl } from './chain.js';
import { createRobinhoodTransport, type RobinhoodProviderOptions } from './provider.js';
import { isEvmAddress, isEvmTxHash } from './validation.js';
export interface EvmReceipt { transactionHash: string; status?: '0x0' | '0x1'; blockNumber?: string; from?: string; to?: string | null; logs?: unknown[]; machineId?: string | undefined; sessionId?: string; memo?: string | undefined; value?: string; }
export interface EvmTransaction { hash?: string; from?: string; to?: string | null; value?: string; blockNumber?: string | null; }
export interface RobinhoodVerifyOptions extends RobinhoodProviderOptions { fixture?: boolean | undefined; expectation?: ReceiptExpectation | undefined; minConfirmations?: number; }
const norm = (value?: string | null) => value?.toLowerCase();
function compareExpectation(receipt: EvmReceipt, tx: EvmTransaction | undefined, status: 'success' | 'failed' | 'pending', expectation: ReceiptExpectation | undefined, fixture?: boolean): { matched: boolean; reasons: string[]; fields: ReceiptEvidenceField[] } {
  const reasons: string[] = [];
  const fields: ReceiptEvidenceField[] = [evidence('status','native_receipt',{ actual: status, matched: !expectation?.status || expectation.status === status }), evidence('chainId','native_receipt',{ matched: true })];
  if (!expectation) return { matched: true, reasons, fields };
  if (expectation.status && expectation.status !== status) reasons.push(`status expected ${expectation.status} got ${status}`);
  if (expectation.from) {
    const actual = tx?.from ?? receipt.from;
    if (!actual) { reasons.push('expected from unavailable in receipt'); fields.push(evidence('from','unavailable',{ expected: expectation.from, matched: false })); }
    else { const matched = norm(expectation.from) === norm(actual); if (!matched) reasons.push('from address mismatch'); fields.push(evidence('from', tx?.from ? 'transaction' : 'native_receipt', { expected: expectation.from, actual, matched })); }
  }
  const expectedTo = expectation.to ?? expectation.recipient;
  if (expectedTo) {
    const actual = tx?.to ?? receipt.to ?? undefined;
    if (!actual) { reasons.push('expected recipient unavailable in receipt'); fields.push(evidence('to','unavailable',{ expected: expectedTo, matched: false })); }
    else { const matched = norm(expectedTo) === norm(actual); if (!matched) reasons.push('to address mismatch'); fields.push(evidence('to', tx?.to ? 'transaction' : 'native_receipt', { expected: expectedTo, actual, matched })); }
  }
  if (expectation.amount) {
    if (tx?.value) { const matched = baseUnitsEqualDecimal(tx.value, expectation.amount, 18); if (!matched) reasons.push('amount mismatch'); fields.push(evidence('amount','transaction',{ expected: expectation.amount, actual: tx.value, matched, detail: 'ETH value compared in wei/base units' })); }
    else if (fixture && receipt.value !== undefined) { const matched = receipt.value === expectation.amount; if (!matched) reasons.push('amount mismatch'); fields.push(evidence('amount','fixture',{ expected: expectation.amount, actual: receipt.value, matched, detail: 'fixture envelope amount, not native EVM receipt value' })); }
    else { reasons.push('expected amount unavailable in receipt'); fields.push(evidence('amount','unavailable',{ expected: expectation.amount, matched: false, detail: 'EVM receipts do not include native value; transaction lookup or event evidence required' })); }
  }
  for (const [field, actual] of [['machineId', receipt.machineId], ['sessionId', receipt.sessionId], ['memo', receipt.memo]] as const) {
    const expected = expectation[field];
    if (!expected) continue;
