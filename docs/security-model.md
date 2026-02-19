# Security model

MachineFi Runtime is a read-only verification and unsigned-intent interface. The package validates public inputs, normalizes telemetry, evaluates public-safe policy constraints, and verifies receipts. It does not control robots directly, sign transactions, broadcast autonomous payments, or custody assets.

Sensitive production concerns such as hardware drivers, private policy engines, provider routing, treasury controls, and incident response remain outside this repository.
