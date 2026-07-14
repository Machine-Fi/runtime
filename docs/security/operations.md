# Security and Operations Readiness

## Runtime modes

- **Fixture mode:** deterministic local transport for CI, CLI smoke tests, and package review. It uses bundled real-shaped Robinhood and Solana receipt fixtures.
- **Live-read mode:** caller supplies RPC endpoints through `MACHINEFI_ROBINHOOD_RPC_URL` and `MACHINEFI_SOLANA_RPC_URL`. The package performs read-only receipt and status lookups.

## Trust boundaries

### Robinhood adapter

The Robinhood adapter owns chain metadata for chain ID `4663`, EVM address/hash validation, Blockscout URL builders, and `eth_getTransactionReceipt` read-only receipt verification. It builds settlement intents for caller-wallet signing and does not hold signing authority.

### Solana adapter

The Solana adapter owns base58 address/signature validation, explorer URL generation, `getSignatureStatuses`, and `getTransaction` read-only verification semantics. It handles missing transactions and status errors explicitly and returns typed verification results. Solana `getVersion` proves endpoint reachability, not cluster identity; live status results therefore avoid claiming a mainnet/devnet/testnet match from version data alone.

### RPC transport

The live transport sends JSON-RPC requests to caller-configured endpoints. Operators should use provider endpoints with appropriate rate limits, monitoring, and key rotation. Public endpoints are suitable for demos and local checks only.

## Wallet and provider handling

- Keep RPC provider tokens in the application environment, not in source files or fixtures.
- Keep wallet signing inside caller-owned wallet/provider surfaces.
- Treat fixture receipts as offline validation inputs for local development and CI.

## Failure modes and recovery

| Failure mode | Expected behavior | Operator action |
| --- | --- | --- |
| RPC timeout or provider error | returns an RPC error result | retry with provider endpoint or inspect provider status |
| Receipt not found | returns `not_found` | confirm transaction id, commitment/finality, and network |
| Solana status error | returns failed verification | inspect transaction meta and caller wallet state |
| Invalid address/hash/signature | returns invalid input | reject before wallet signing or receipt lookup |

## Release/readiness checklist

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:smoke`
- `npm pack --dry-run --json`
- Review package file list for the intended `dist`, docs, fixtures, examples, and license entries.
- Confirm public GitHub and npm links point to the current version.
