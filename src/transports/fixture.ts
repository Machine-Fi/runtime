import robinhoodFixtures from '../fixtures/robinhood-receipts.json' with { type: 'json' };
import solanaFixtures from '../fixtures/solana-receipts.json' with { type: 'json' };
export const fixtureData = { robinhood: robinhoodFixtures, solana: solanaFixtures } as const;
export function getFixtureReceipt(chain: 'robinhood' | 'solana', id: string): unknown | undefined {
  const rows = chain === 'robinhood' ? robinhoodFixtures.receipts : solanaFixtures.receipts;
  return rows.find((row: { id: string }) => row.id === id);
}
