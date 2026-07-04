import { pair } from '../cli/commands/pair.js';
console.log(JSON.stringify(pair({ chain: 'robinhood', fixture: true }), null, 2));
