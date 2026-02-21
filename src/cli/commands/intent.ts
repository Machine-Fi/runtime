import type { RuntimeChain } from '../../adapters/shared/types.js';
import { buildSettlementIntent } from '../../settlement/intents.js';
export function buildIntent(input: { chain: RuntimeChain; source: string; recipient: string; amount: string; asset?: string | undefined; machineId: string; sessionId: string; policyId: string; memo?: string | undefined; reference?: string | undefined; fixture?: boolean }) {
  return buildSettlementIntent({ ...input, nonce: input.fixture ? `fixture:${input.machineId}:${input.sessionId}` : undefined });
}
