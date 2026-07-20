import Link from "next/link";
import type { Transaction } from "@/lib/balances";
import { Button } from "@/components/ui/Button";

export function BalanceSummary({
  groupId,
  transactionsByCurrency,
  labelById,
  currentUserId,
}: {
  groupId: string;
  transactionsByCurrency: Record<string, Transaction[]>;
  labelById: Record<string, string>;
  currentUserId: string;
}) {
  const currencies = Object.keys(transactionsByCurrency).filter(
    (c) => transactionsByCurrency[c].length > 0
  );

  if (currencies.length === 0) {
    return <p className="text-sm text-muted">Svi ste izmireni. 🎉</p>;
  }

  return (
    <div className="space-y-4">
      {currencies.map((currency) => (
        <div key={currency}>
          <p className="mb-2 text-xs font-medium uppercase text-muted">{currency}</p>
          <ul className="space-y-2">
            {transactionsByCurrency[currency].map((t, i) => {
              const involvesMe = t.from === currentUserId || t.to === currentUserId;
              return (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-2 text-sm"
                >
                  <span>
                    <span className={t.from === currentUserId ? "font-medium text-owe" : ""}>
                      {labelById[t.from] ?? "?"}
                    </span>{" "}
                    duguje{" "}
                    <span className={t.to === currentUserId ? "font-medium text-owed" : ""}>
                      {labelById[t.to] ?? "?"}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">
                      {t.amount.toFixed(2)} {currency}
                    </span>
                    {involvesMe && (
                      <Link
                        href={`/groups/${groupId}/settle-up?from=${t.from}&to=${t.to}&amount=${t.amount}&currency=${currency}`}
                      >
                        <Button variant="secondary" className="px-2 py-1 text-xs">
                          Poravnaj
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
