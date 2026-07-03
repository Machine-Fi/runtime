export const isEvmAddress = (value: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(value);
export const isEvmTxHash = (value: string): boolean => /^0x[a-fA-F0-9]{64}$/.test(value);
export function assertEvmAddress(value: string, label = 'address'): void { if (!isEvmAddress(value)) throw new Error(`invalid EVM ${label}`); }
export function assertEvmTxHash(value: string): void { if (!isEvmTxHash(value)) throw new Error('invalid EVM transaction hash'); }
