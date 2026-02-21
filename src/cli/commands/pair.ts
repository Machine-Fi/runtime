import type { RuntimeChain, MachineSession } from '../../adapters/shared/types.js';
import { createMachineSession } from '../../sessions/session.js';
export function pair(input: { chain: RuntimeChain; fixture?: boolean | undefined; machineId?: string | undefined; machineLabel?: string | undefined; wallet?: string | undefined; operator?: string | undefined; policy?: string | undefined; role?: string | undefined; now?: string }): MachineSession {
  const fixtureWallet = input.chain === 'robinhood' ? '0x1111111111111111111111111111111111111111' : '11111111111111111111111111111111';
  return createMachineSession({ chain: input.chain, walletAddress: input.wallet ?? (input.fixture ? fixtureWallet : ''), machineId: input.machineId ?? (input.fixture ? `fixture-${input.chain}-machine` : ''), machineLabel: input.machineLabel, operatorId: input.operator ?? (input.fixture ? 'fixture-operator' : ''), policyProfileId: input.policy ?? 'standard-machine-policy', mode: input.fixture ? 'fixture' : 'live-read', nonce: input.fixture ? `fixture:${input.chain}:${input.machineId ?? 'machine'}` : undefined, now: input.now, metadata: input.role ? { role: input.role as never } : undefined });
}
