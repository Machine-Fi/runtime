import { robinhoodMainnet, robinhoodChainIdHex } from '../../adapters/robinhood/chain.js';
export function inspect(chain: string) { return chain === 'robinhood' ? { chainId: robinhoodMainnet.id, hex: robinhoodChainIdHex(), explorer: robinhoodMainnet.blockExplorers.default.url } : { chain: 'solana', rpcEnv: 'MACHINEFI_SOLANA_RPC_URL', explorer: 'https://explorer.solana.com' }; }
