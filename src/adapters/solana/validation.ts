const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;
export const isBase58 = (value: string): boolean => BASE58.test(value);
export function decodeBase58(value: string): Uint8Array {
  if (!isBase58(value)) throw new Error('invalid base58 string');
  const bytes: number[] = [];
  for (const char of value) {
    let carry = ALPHABET.indexOf(char);
    if (carry < 0) throw new Error('invalid base58 character');
    for (let i = 0; i < bytes.length; i += 1) {
      carry += bytes[i]! * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) { bytes.push(carry & 0xff); carry >>= 8; }
  }
  for (const char of value) { if (char === '1') bytes.push(0); else break; }
  return Uint8Array.from(bytes.reverse());
}
export const isSolanaAddress = (value: string): boolean => { try { return decodeBase58(value).length === 32; } catch { return false; } };
export const isSolanaSignature = (value: string): boolean => { try { return decodeBase58(value).length === 64; } catch { return false; } };
export function assertSolanaAddress(value: string, label = 'address'): void { if (!isSolanaAddress(value)) throw new Error(`invalid Solana ${label}`); }
export function assertSolanaSignature(value: string): void { if (!isSolanaSignature(value)) throw new Error('invalid Solana signature'); }
