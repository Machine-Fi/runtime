import { defineChain } from 'viem';
export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_TESTNET_CHAIN_ID = 46630;
export const ROBINHOOD_PUBLIC_RPC = 'https://rpc.mainnet.chain.robinhood.com';
export const ROBINHOOD_EXPLORER = 'https://robinhoodchain.blockscout.com';
export const robinhoodMainnet = defineChain({ id: ROBINHOOD_CHAIN_ID, name: 'Robinhood Chain', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [ROBINHOOD_PUBLIC_RPC] } }, blockExplorers: { default: { name: 'Blockscout', url: ROBINHOOD_EXPLORER } } });
export const robinhoodChainIdHex = () => `0x${ROBINHOOD_CHAIN_ID.toString(16)}`;
export const robinhoodTxUrl = (hash: string) => `${ROBINHOOD_EXPLORER}/tx/${hash}`;
export const robinhoodAddressUrl = (address: string) => `${ROBINHOOD_EXPLORER}/address/${address}`;
