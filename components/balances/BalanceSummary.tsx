import Link from "next/link";
import type { Transaction } from "@/lib/balances";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function BalanceSummary({
  groupId,
  transactionsByCurrency,
  labelById,
  currentUserId,
  t,
}: {
  groupId: string;
  transactionsByCurrency: Record<string, Transaction[]>;
  labelById: Record<string, string>;
  currentUserId: string;
  t: Dictionary["balance"];
}) {
  const currencies = Object.keys(transactionsByCurrency).filter(
    (c) => transactionsByCurrency[c].length > 0
  );

  if (currencies.length === 0) {
    return <p className="text-sm text-muted">{t.settled}</p>;
  }

  return (
    <div className="space-y-4">
      {currencies.map((currency) => (
        <div key={currency}>
          <p className="mb-2 text-xs font-medium uppercase text-muted">{currency}</p>
          <ul className="space-y-2">
            {transactionsByCurrency[currency].map((tx, i) => {
              const involvesMe = tx.from === currentUserId || tx.to === currentUserId;
              return (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-2 text-sm"
                >
                  <span>
                    <span className={tx.from === currentUserId ? "font-medium text-owe" : ""}>
                      {labelById[tx.from] ?? "?"}
                    </span>{" "}
                    {t.owes}{" "}
                    <span className={tx.to === currentUserId ? "font-medium text-owed" : ""}>
                      {labelById[tx.to] ?? "?"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">
                      {tx.amount.toFixed(2)} {currency}
                    </span>
                    {involvesMe && (
                      <Link
                        href={`/groups/${groupId}/settle-up?from=${tx.from}&to=${tx.to}&amount=${tx.amount}&currency=${currency}`}
                      >
                        <Button variant="secondary" className="px-2 py-1 text-xs">
                          {t.settleUp}
                        </Button>
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
