# Security and Operations Review Notes

This branch captures operational checks for the public runtime package. The focus is the code and scripts shipped in this repository: package scripts, transport boundaries, fixture behavior, and receipt evidence handling.

## Secret handling

- Keep credentials out of examples, fixtures, tests, and documentation.
- Treat RPC URLs, wallet material, provider credentials, and settlement authorization as caller-supplied configuration.
- Keep fixture-mode examples deterministic and free of live account material.

## Provider and RPC boundaries

- Solana helpers should report transport reachability and source context without requiring private infrastructure.
- Robinhood adapter utilities should parse and verify receipt evidence supplied by the caller or fixture data.
- Live provider calls must remain opt-in and should fail clearly when required configuration is absent.

## Package script boundaries

- Build scripts should compile TypeScript and prepare package documentation only.
- Test and smoke scripts should run without mutating external accounts or publishing artifacts.
- Packing should restore the repository README after npm README substitution.

## Runtime safety expectations

- Public runtime code may form unsigned settlement intents and verify receipt evidence.
- Treasury controls, production robot orchestration, and live provider authorization remain outside this package.
- Any future live-mode expansion should keep fixture behavior available for deterministic local checks.
