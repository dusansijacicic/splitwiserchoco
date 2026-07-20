import Link from "next/link";

export type ExpenseRow = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  paidByLabel: string;
  expenseDate: string;
  createdBy: string;
};

export function ExpenseListItem({
  expense,
  currentUserId,
}: {
  expense: ExpenseRow;
  currentUserId: string;
}) {
  return (
    <li className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{expense.description}</p>
        <p className="text-xs text-muted">
          Platio/la {expense.paidByLabel} · {expense.expenseDate}
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
            Izmeni
          </Link>
        )}
      </div>
    </li>
  );
}
