import { expect, it } from 'vitest';
import { ROBINHOOD_CHAIN_ID, robinhoodChainIdHex } from '../src/adapters/robinhood/chain.js';
import { verifyRobinhoodReceipt } from '../src/adapters/robinhood/receipts.js';
import { isEvmAddress, isEvmTxHash } from '../src/adapters/robinhood/validation.js';
import { FixtureRpcTransport } from '../src/transports/fixture-rpc.js';

const tx = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

it('keeps Robinhood chain metadata accurate', () => {
  expect(ROBINHOOD_CHAIN_ID).toBe(4663);
  expect(robinhoodChainIdHex()).toBe('0x1237');
});

it('validates EVM identifiers', () => {
  expect(isEvmAddress('0x1111111111111111111111111111111111111111')).toBe(true);
  expect(isEvmTxHash(tx)).toBe(true);
  expect(isEvmTxHash('0x1234')).toBe(false);
});

it('verifies fixture receipt expectations', async () => {
  const result = await verifyRobinhoodReceipt(tx, { fixture: true, expectation: { status: 'success', from: '0x1111111111111111111111111111111111111111', to: '0x2222222222222222222222222222222222222222', amount: '1.25', machineId: 'robot-arm-17', sessionId: 'mfi_robinhood_fixture_session' } });
  expect(result.ok && result.value.verified).toBe(true);
  expect(result.ok && result.value.chainMatched).toBe(true);
});

it('returns expectation mismatches', async () => {
  const result = await verifyRobinhoodReceipt(tx, { fixture: true, expectation: { to: '0x3333333333333333333333333333333333333333' } });
  expect(result.ok && result.value.expectationsMatched).toBe(false);
  expect(result.ok && result.value.mismatchReasons?.[0]).toContain('to address');
});

it('rejects wrong-chain RPC responses before labeling receipt', async () => {
  const transport = new FixtureRpcTransport({ eth_chainId: '0x1', eth_getTransactionReceipt: null });
  const result = await verifyRobinhoodReceipt(tx, { transport });
  expect(result.ok && result.value.chainMatched).toBe(false);
  expect(result.ok && result.value.verified).toBe(false);
});
