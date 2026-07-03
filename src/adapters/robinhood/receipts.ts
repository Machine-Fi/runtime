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
    if (actual === undefined) { reasons.push(`expected ${field} unavailable in receipt`); fields.push(evidence(field,'unavailable',{ expected, matched: false })); }
    else { const matched = actual === expected; if (!matched) reasons.push(`${field === 'machineId' ? 'machine id' : field === 'sessionId' ? 'session id' : 'memo'} mismatch`); fields.push(evidence(field, fixture ? 'fixture' : 'machinefi_envelope', { expected, actual, matched, detail: fixture ? 'fixture envelope metadata' : 'MachineFi envelope metadata' })); }
  }
  return { matched: reasons.length === 0, reasons, fields };
}
export async function verifyRobinhoodReceipt(txHash: string, options: RobinhoodVerifyOptions = {}): Promise<RuntimeResult<ReceiptVerification>> {
  if (!isEvmTxHash(txHash)) return err('invalid_input', 'Invalid Robinhood transaction hash');
  if (options.expectation?.from && !isEvmAddress(options.expectation.from)) return err('invalid_input', 'Invalid expected from address');
  if (options.expectation?.to && !isEvmAddress(options.expectation.to)) return err('invalid_input', 'Invalid expected to address');
  try {
    const transport = options.fixture ? undefined : createRobinhoodTransport(options);
    const chainId = options.fixture ? `0x${ROBINHOOD_CHAIN_ID.toString(16)}` : await transport!.request<string>('eth_chainId', []);
    const chainMatched = Number.parseInt(chainId, 16) === ROBINHOOD_CHAIN_ID;
    if (!chainMatched) return ok({ chain: 'robinhood', id: txHash, found: false, verified: false, chainMatched, status: 'not_found', statusMatched: false, expectationsMatched: false, mismatchReasons: [`expected Robinhood chain ${ROBINHOOD_CHAIN_ID} got ${chainId}`], evidence: [evidence('chainId','native_receipt',{ expected: String(ROBINHOOD_CHAIN_ID), actual: chainId, matched: false })], explorerUrl: robinhoodTxUrl(txHash) });
    const receipt = options.fixture ? getFixtureReceipt('robinhood', txHash) as EvmReceipt | undefined : await transport!.request<EvmReceipt | null>('eth_getTransactionReceipt', [txHash]);
    if (!receipt) return ok({ chain: 'robinhood', id: txHash, found: false, verified: false, chainMatched, status: 'not_found', statusMatched: false, expectationsMatched: false, explorerUrl: robinhoodTxUrl(txHash) });
    const tx = options.fixture ? undefined : await transport!.request<EvmTransaction | null>('eth_getTransactionByHash', [txHash]).catch(() => null) ?? undefined;
    const status: 'success' | 'failed' | 'pending' = receipt.status === '0x1' ? 'success' : receipt.status === '0x0' ? 'failed' : 'pending';
    const expectation = compareExpectation(receipt, tx, status, options.expectation, options.fixture);
    let confirmations = 0;
    let finality: 'finalized' | 'confirmed' | 'pending' = 'pending';
    if (receipt.blockNumber) {
      if (options.fixture) { confirmations = receipt.blockNumber ? 1 : 0; finality = confirmations > 0 ? 'confirmed' : 'pending'; }
      else {
        const currentBlockHex = await transport!.request<string>('eth_blockNumber', []).catch(() => undefined);
        if (typeof currentBlockHex === 'string') { const derived = deriveEvmConfirmations({ receiptBlock: receipt.blockNumber, currentBlock: currentBlockHex }); confirmations = derived.confirmations; finality = derived.finality === 'finalized' ? 'finalized' : confirmations > 0 ? 'confirmed' : 'pending'; }
      }
    }
    const minimumConfirmations = options.minConfirmations ?? 0;
    const confirmationMatched = confirmations >= minimumConfirmations;
    const reasons = [...expectation.reasons];
    const fields = [...expectation.fields];
    if (!confirmationMatched) { reasons.push(`minimum confirmations not reached: expected ${minimumConfirmations} got ${confirmations}`); }
    const expectationsMatched = expectation.matched && confirmationMatched;
    const verified = chainMatched && status === 'success' && expectationsMatched;
    return ok({ chain: 'robinhood', id: txHash, found: true, verified, chainMatched, status, statusMatched: !options.expectation?.status || options.expectation.status === status, expectationsMatched, mismatchReasons: reasons, finality, confirmations, explorerUrl: robinhoodTxUrl(txHash), raw: { receipt, transaction: tx ?? undefined }, evidence: fields, settlementEvidence: splitEvidence(fields), ...(receipt.blockNumber ? { block: receipt.blockNumber } : {}) });
  } catch (cause) { return err('rpc_error', 'Robinhood receipt lookup failed', cause); }
}
