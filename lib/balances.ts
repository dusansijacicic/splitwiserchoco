export type Transaction = { from: string; to: string; amount: number };

type ExpenseInput = {
  paidBy: string;
  currency: string;
  participants: { userId: string; shareAmount: number }[];
};

type SettlementInput = {
  paidBy: string;
  paidTo: string;
  amount: number;
  currency: string;
};

/**
 * Net balance per user, grouped by currency (positive = is owed money,
 * negative = owes money). No cross-currency conversion — a group's
 * balances are simply reported as separate lines per currency.
 */
export function computeNetBalances(
  expenses: ExpenseInput[],
  settlements: SettlementInput[]
): Record<string, Record<string, number>> {
  const net: Record<string, Record<string, number>> = {};

  const add = (currency: string, userId: string, delta: number) => {
    net[currency] ??= {};
    net[currency][userId] = (net[currency][userId] ?? 0) + delta;
  };

  for (const exp of expenses) {
    for (const p of exp.participants) {
      if (p.userId === exp.paidBy) continue;
      add(exp.currency, exp.paidBy, p.shareAmount);
      add(exp.currency, p.userId, -p.shareAmount);
    }
  }

  for (const s of settlements) {
    add(s.currency, s.paidBy, s.amount);
    add(s.currency, s.paidTo, -s.amount);
  }

  return net;
}

/**
 * Greedy largest-debtor-to-largest-creditor pairing. Not guaranteed to be
 * the mathematically optimal minimum transaction count (that's NP-hard in
 * general), but it's deterministic and produces a good-enough result —
 * the same approach Splitwise itself uses.
 */
export function simplifyDebts(net: Record<string, number>): Transaction[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, amount] of Object.entries(net)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.005) creditors.push({ userId, amount: rounded });
    else if (rounded < -0.005) debtors.push({ userId, amount: -rounded });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const settled = Math.min(debtors[i].amount, creditors[j].amount);
    transactions.push({
      from: debtors[i].userId,
      to: creditors[j].userId,
      amount: Math.round(settled * 100) / 100,
    });
    debtors[i].amount -= settled;
    creditors[j].amount -= settled;
    if (debtors[i].amount < 0.005) i++;
    if (creditors[j].amount < 0.005) j++;
  }

  return transactions;
}

export function simplifyDebtsByCurrency(
  netByCurrency: Record<string, Record<string, number>>
): Record<string, Transaction[]> {
  const result: Record<string, Transaction[]> = {};
  for (const [currency, net] of Object.entries(netByCurrency)) {
    result[currency] = simplifyDebts(net);
  }
  return result;
}
