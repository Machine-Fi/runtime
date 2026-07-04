import type { RuntimeChain, ReceiptExpectation } from '../../adapters/shared/types.js';
import { verifyRobinhoodReceipt } from '../../adapters/robinhood/receipts.js';
import { verifySolanaReceipt } from '../../adapters/solana/receipts.js';
export async function verify(args: { chain: RuntimeChain; id: string; fixture?: boolean; expectation?: ReceiptExpectation }) {
  const options = args.fixture === undefined ? { expectation: args.expectation } : { fixture: args.fixture, expectation: args.expectation };
  return args.chain === 'robinhood' ? verifyRobinhoodReceipt(args.id, options) : verifySolanaReceipt(args.id, options);
}
