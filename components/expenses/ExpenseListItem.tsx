import Link from "next/link";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type ExpenseRow = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidByLabel: string;
  expenseDate: string;
  createdBy: string;
  shares: { userId: string; amount: number }[];
};

function isEqualSplit(shares: { amount: number }[]): boolean {
  if (shares.length <= 1) return true;
  const [first, ...rest] = shares;
  return rest.every((s) => Math.abs(s.amount - first.amount) < 0.02);
}

export function ExpenseListItem({
  expense,
  currentUserId,
  labelById,
  t,
}: {
  expense: ExpenseRow;
  currentUserId: string;
  labelById: Record<string, string>;
  t: Dictionary["expenses"];
}) {
  const equalSplit = isEqualSplit(expense.shares);

  return (
    <li className="py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{expense.description}</p>
          <p className="text-xs text-muted">
            {t.paidByLine(expense.paidByLabel, expense.expenseDate)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium">
            {expense.amount.toFixed(2)} {expense.currency}
          </p>
          {expense.createdBy === currentUserId && (
            <Link
              href={`/groups/${expense.groupId}/expenses/${expense.id}/edit`}
              className="text-xs text-primary hover:underline"
            >
              {t.edit}
            </Link>
          )}
        </div>
      </div>
      {!equalSplit && (
        <p className="mt-1 text-xs text-muted">
          {expense.shares
            .map((s) => `${labelById[s.userId] ?? "?"}: ${s.amount.toFixed(2)} ${expense.currency}`)
            .join(" · ")}
        </p>
      )}
    </li>
  );
}
