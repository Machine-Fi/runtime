# MachineFi Runtime

MachineFi Runtime is a TypeScript SDK and CLI for wallet-linked autonomous machines on Solana rails.

## Install

```bash
npm install @machinefi/runtime
npx machinefi status --chain solana --fixture
```

Package entrypoints expose a CLI and typed runtime exports.

## Runtime scope

Machine identity, capabilities, sessions, fixtures, and receipt evidence are the first inspectable surfaces.

Solana fixture status checks keep examples deterministic while provider reads stay caller configured.

Solana settlement intents are unsigned records for caller-wallet flows.
