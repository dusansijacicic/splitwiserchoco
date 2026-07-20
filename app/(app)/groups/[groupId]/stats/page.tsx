import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { computeTripStats } from "@/lib/stats";
import { getDictionary } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";

export default async function GroupStatsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();
  const { t } = await getDictionary();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  const [{ data: memberRows }, { data: expenseRows }] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id, profiles(id, display_name)")
      .eq("group_id", groupId)
      .not("user_id", "is", null),
    supabase
      .from("expenses")
      .select("paid_by, currency, amount, expense_participants(user_id, share_amount)")
      .eq("group_id", groupId),
  ]);

  const labelById: Record<string, string> = {};
  for (const m of memberRows ?? []) {
    const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
    if (profile) labelById[profile.id] = profile.display_name;
  }

  const expenseInputs = (expenseRows ?? []).map((e) => ({
    paidBy: e.paid_by,
    currency: e.currency,
    amount: Number(e.amount),
    participants: (e.expense_participants ?? []).map((p) => ({
      userId: p.user_id,
      shareAmount: Number(p.share_amount),
    })),
  }));

  const tripStats = computeTripStats(expenseInputs);
  const currencies = Object.keys(tripStats);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t.groups.stats} — {group.name}
        </h1>
        <Link href={`/groups/${groupId}`} className="text-sm text-primary hover:underline">
          {t.stats.backToGroup}
        </Link>
      </div>

      {currencies.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-muted">{t.stats.empty}</p>
        </Card>
      ) : (
        currencies.map((currency) => {
          const bucket = tripStats[currency];
          const members = Object.entries(bucket.perMember);
          return (
            <Card key={currency} className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                {currency}
              </p>
              <p className="mt-1 text-5xl font-semibold leading-tight">
                {bucket.total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                <span className="ml-2 text-lg font-medium text-muted">{currency}</span>
              </p>
              <p className="mt-1 text-sm text-muted">{t.stats.total.replace(":", "")}</p>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {members.map(([userId, m]) => (
                  <div key={userId} className="rounded-xl border border-border p-4">
                    <p className="font-medium">{labelById[userId] ?? "?"}</p>
                    <div className="mt-3 flex items-baseline justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted">{t.stats.paid}</p>
                        <p className="text-2xl font-semibold">{m.paid.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">{t.stats.share}</p>
                        <p className="text-2xl font-semibold">{m.share.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
