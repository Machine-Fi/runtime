# Public Runtime Boundaries

This branch documents the public package boundary for maintainers reviewing SDK and CLI changes. It describes what the `@machinefi/runtime` package owns and how adapters should present evidence to application code.

## Runtime-owned surfaces

- Machine identity and capability descriptors.
- Job lifecycle records and telemetry snapshots.
- Policy decision inputs and evaluation results.
- Unsigned settlement intent construction.
- Receipt evidence parsing, normalization, and confidence checks.
- CLI commands for pairing, intent inspection, status checks, and receipt verification.

## Adapter responsibilities

### Solana

- Keep chain status reporting explicit about fixture versus live transport mode.
- Preserve source-aware receipt evidence fields used by verification tests.
- Avoid embedding account secrets, signing authority, or production settlement policy in the package.

### Robinhood

- Normalize receipt inputs into runtime evidence records.
- Keep provider-specific validation isolated behind adapter helpers.
- Return clear unavailable states when evidence cannot meet expected checks.

## Outside the package

- Robot-control loops and hardware drivers.
- Production scheduling and fleet orchestration.
- Treasury approval, custody, and signing services.
- Private provider routing and account operations.
- Application-specific policy services.

## Fixture and live-mode behavior

Fixture mode should remain deterministic for tests and examples. Live mode should be explicit, caller-configured, and observable through status and verification results rather than hidden side effects.
