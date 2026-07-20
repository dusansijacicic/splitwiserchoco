export type TripStatsByCurrency = Record<
  string,
  {
    total: number;
    perMember: Record<string, { paid: number; share: number }>;
  }
>;

type ExpenseStatInput = {
  paidBy: string;
  currency: string;
  amount: number;
  participants: { userId: string; shareAmount: number }[];
};

/**
 * Per-currency trip totals: overall spend, plus per member how much they
 * physically paid vs. their share of the actual costs — mirrors the
 * "Cost Overview" summary from a typical shared-trip spreadsheet.
 */
export function computeTripStats(expenses: ExpenseStatInput[]): TripStatsByCurrency {
  const stats: TripStatsByCurrency = {};

  for (const exp of expenses) {
    stats[exp.currency] ??= { total: 0, perMember: {} };
    const bucket = stats[exp.currency];
    bucket.total += exp.amount;

    bucket.perMember[exp.paidBy] ??= { paid: 0, share: 0 };
    bucket.perMember[exp.paidBy].paid += exp.amount;

    for (const p of exp.participants) {
      bucket.perMember[p.userId] ??= { paid: 0, share: 0 };
      bucket.perMember[p.userId].share += p.shareAmount;
    }
  }

  return stats;
}
