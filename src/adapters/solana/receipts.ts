import { getFixtureReceipt } from '../../transports/fixture.js';
import { err, ok, type RuntimeResult } from '../shared/result.js';
import type { ReceiptExpectation, ReceiptVerification } from '../shared/types.js';
import { evidence, splitEvidence, type ReceiptEvidenceField } from '../shared/evidence.js';
import { baseUnitsEqualDecimal, subtractBaseUnits } from '../../settlement/amounts.js';
import { createSolanaTransport, solanaTxUrl, type SolanaProviderOptions } from './provider.js';
import { isSolanaAddress, isSolanaSignature } from './validation.js';
interface StatusValue { slot?: number; confirmationStatus?: 'processed' | 'confirmed' | 'finalized'; err?: unknown; confirmations?: number | null; }
interface SolanaTransaction { slot?: number; blockTime?: number | null; meta?: { err?: unknown; preBalances?: Array<number | string>; postBalances?: Array<number | string>; logMessages?: string[] | null } | null; transaction?: { message?: { accountKeys?: Array<string | { pubkey?: string }> } }; memo?: string | undefined; machineId?: string | undefined; sessionId?: string; amount?: string; }
export interface SolanaVerifyOptions extends SolanaProviderOptions { fixture?: boolean | undefined; searchTransactionHistory?: boolean | undefined; expectation?: ReceiptExpectation | undefined; }
function accountKeys(tx: SolanaTransaction): string[] { return (tx.transaction?.message?.accountKeys ?? []).map((key) => typeof key === 'string' ? key : key.pubkey ?? '').filter(Boolean); }
function memoFromLogs(tx: SolanaTransaction | undefined): string | undefined { return tx?.meta?.logMessages?.map((line) => /Memo(?: \(len \d+\))?:\s*(.+)$/i.exec(line)?.[1]?.trim()).find(Boolean); }
interface SolTransferEvidence { senderDebit: bigint; recipientCredit: bigint; feeGap: bigint; }
function solTransferEvidence(tx: SolanaTransaction, from?: string, to?: string): SolTransferEvidence | undefined { const keys = accountKeys(tx); const pre = tx.meta?.preBalances; const post = tx.meta?.postBalances; if (!pre || !post || !from || !to || from === to) return undefined; const fromIndex = keys.indexOf(from); const toIndex = keys.indexOf(to); if (fromIndex < 0 || toIndex < 0) return undefined; try { const senderDebit = subtractBaseUnits(pre[fromIndex]!, post[fromIndex]!); const recipientCredit = subtractBaseUnits(post[toIndex]!, pre[toIndex]!); if (senderDebit > 0n && recipientCredit > 0n && senderDebit >= recipientCredit) return { senderDebit, recipientCredit, feeGap: senderDebit - recipientCredit }; return undefined; } catch { return undefined; } }
function compareExpectation(tx: SolanaTransaction | undefined, status: 'success' | 'failed' | 'pending', expectation?: ReceiptExpectation, fixture?: boolean): { matched: boolean; reasons: string[]; fields: ReceiptEvidenceField[] } {
  const reasons: string[] = [];
  const fields: ReceiptEvidenceField[] = [evidence('status','native_receipt',{ actual: status, matched: !expectation?.status || expectation.status === status })];
  if (!expectation) return { matched: true, reasons, fields };
  const keys = tx ? accountKeys(tx) : [];
  if (expectation.status && expectation.status !== status) reasons.push(`status expected ${expectation.status} got ${status}`);
  const expectedTo = expectation.to ?? expectation.recipient;
  const transfer = tx ? solTransferEvidence(tx, expectation.from, expectedTo) : undefined;
  const hasTransferCounterparty = Boolean(expectation.from && expectedTo);
  const addReason = (reason: string) => { if (!reasons.includes(reason)) reasons.push(reason); };
  if (expectation.from) {
    if (!tx) { reasons.push('expected from unavailable in transaction'); fields.push(evidence('from','unavailable',{ expected: expectation.from, matched: false })); }
    else if (!keys.includes(expectation.from)) { reasons.push('from account not found in transaction'); fields.push(evidence('accountInvolvement','transaction',{ expected: expectation.from, matched: false, detail: 'account involvement only, not transfer settlement' })); }
    else if (!hasTransferCounterparty) { addReason('transfer counterparty evidence unavailable'); fields.push(evidence('accountInvolvement','transaction',{ expected: expectation.from, matched: false, detail: 'account involvement only, not transfer settlement' })); }
    else if (!transfer) { addReason('transfer direction evidence unavailable'); fields.push(evidence('accountInvolvement','transaction',{ expected: expectation.from, matched: false, detail: 'account involvement only, not transfer settlement' })); }
    else { fields.push(evidence('from','balance_delta',{ expected: expectation.from, matched: true, detail: 'sender debit supports transfer direction' })); }
  }
  if (expectedTo) {
    if (!tx) { reasons.push('expected recipient unavailable in transaction'); fields.push(evidence('to','unavailable',{ expected: expectedTo, matched: false })); }
    else if (!keys.includes(expectedTo)) { reasons.push('recipient account not found in transaction'); fields.push(evidence('accountInvolvement','transaction',{ expected: expectedTo, matched: false, detail: 'account involvement only, not transfer settlement' })); }
    else if (!hasTransferCounterparty) { addReason('transfer counterparty evidence unavailable'); fields.push(evidence('accountInvolvement','transaction',{ expected: expectedTo, matched: false, detail: 'account involvement only, not transfer settlement' })); }
