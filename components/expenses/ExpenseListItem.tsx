export type ExpenseRow = {
  id: string;
  description: string;
  amount: number;
  currency: string;
  paidByLabel: string;
  expenseDate: string;
};

export function ExpenseListItem({ expense }: { expense: ExpenseRow }) {
  return (
    <li className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{expense.description}</p>
        <p className="text-xs text-muted">
          Platio/la {expense.paidByLabel} · {expense.expenseDate}
        </p>
      </div>
      <p className="text-sm font-medium">
        {expense.amount.toFixed(2)} {expense.currency}
      </p>
    </li>
  );
}
