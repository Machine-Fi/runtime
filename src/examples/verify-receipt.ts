import { verifyRobinhoodReceipt } from '../adapters/robinhood/receipts.js';
console.log(JSON.stringify(await verifyRobinhoodReceipt('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', { fixture: true }), null, 2));
