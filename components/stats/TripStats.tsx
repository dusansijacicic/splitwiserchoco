import type { TripStatsByCurrency } from "@/lib/stats";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function TripStats({
  stats,
  labelById,
  t,
}: {
  stats: TripStatsByCurrency;
  labelById: Record<string, string>;
  t: Dictionary["stats"];
}) {
  const currencies = Object.keys(stats);

  if (currencies.length === 0) {
    return <p className="text-sm text-muted">{t.empty}</p>;
  }

  return (
    <div className="space-y-5">
      {currencies.map((currency) => {
        const bucket = stats[currency];
        return (
          <div key={currency}>
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-xs font-medium uppercase text-muted">{currency}</p>
              <p className="text-sm font-medium">
                {t.total} {bucket.total.toFixed(2)} {currency}
              </p>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="py-1 pr-2">{t.person}</th>
                  <th className="py-1 pr-2">{t.paid}</th>
                  <th className="py-1 pr-2">{t.share}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(bucket.perMember).map(([userId, m]) => (
                  <tr key={userId} className="border-t border-border">
                    <td className="py-1 pr-2">{labelById[userId] ?? "?"}</td>
                    <td className="py-1 pr-2">
                      {m.paid.toFixed(2)} {currency}
                    </td>
                    <td className="py-1 pr-2">
                      {m.share.toFixed(2)} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
