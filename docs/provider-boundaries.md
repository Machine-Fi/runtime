# Provider boundaries

Live reads use caller-supplied Solana and Robinhood provider endpoints. Fixture mode is deterministic and offline for CI. Public RPCs may be rate-limited; production callers should configure their own providers.

The package never stores private keys, seed phrases, wallet secrets, or provider credentials. Write/broadcast behavior and hardware control remain outside this public package.
