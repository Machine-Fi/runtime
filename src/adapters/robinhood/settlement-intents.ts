import { buildSettlementIntent } from '../../settlement/intents.js';
import type { SettlementIntent } from '../shared/types.js';
export function buildRobinhoodSettlementIntent(input: { source?: string; from?: string; recipient?: string; to?: string; amount: string; asset?: string; machineId: string; sessionId: string; policyId: string; memo?: string; reference?: string; nonce?: string; now?: string }): SettlementIntent {
  return buildSettlementIntent({ chain: 'robinhood', source: input.source ?? input.from ?? '', recipient: input.recipient ?? input.to ?? '', amount: input.amount, asset: input.asset ?? 'ETH', machineId: input.machineId, sessionId: input.sessionId, policyId: input.policyId, memo: input.memo, reference: input.reference, nonce: input.nonce, now: input.now });
}
