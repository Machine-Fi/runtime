# Operations

Use fixture mode for deterministic local development and CI. Use live-read mode only with caller-supplied provider endpoints:

- `MACHINEFI_ROBINHOOD_RPC_URL` or `--rpc-url` for Robinhood reads.
- `MACHINEFI_SOLANA_RPC_URL` or `--rpc-url` for Solana reads.

Operational checks should run `npm run typecheck`, `npm run build`, `npm test`, `npm run test:smoke`, and `npm pack --dry-run --json` before proposing a package release. No npm publication is performed by these commands.
