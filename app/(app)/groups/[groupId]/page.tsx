import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { computeNetBalances, simplifyDebtsByCurrency } from "@/lib/balances";
import { getDictionary } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MemberList, type MemberRow } from "@/components/groups/MemberList";
import { AddMemberForm } from "@/components/groups/AddMemberForm";
import { ExpenseListItem, type ExpenseRow } from "@/components/expenses/ExpenseListItem";
import { BalanceSummary } from "@/components/balances/BalanceSummary";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { t } = await getDictionary();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("id", groupId)
    .single();

  if (!group) {
    notFound();
  }

  const [{ data: memberRows }, { data: expenseRows }, { data: settlementRows }] =
    await Promise.all([
      supabase
        .from("group_members")
        .select("id, user_id, invited_email, profiles(id, email, display_name)")
        .eq("group_id", groupId),
      supabase
        .from("expenses")
        .select(
          "id, description, amount, currency, expense_date, paid_by, created_by, profiles!expenses_paid_by_fkey(display_name), expense_participants(user_id, share_amount)"
        )
        .eq("group_id", groupId)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("settlements")
        .select("paid_by, paid_to, amount, currency")
        .eq("group_id", groupId),
    ]);

  const members: MemberRow[] = (memberRows ?? []).map((m) => {
    const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
    return {
      id: m.id,
      label: profile?.display_name ?? m.invited_email ?? "?",
      pending: profile === null,
    };
  });

  const labelById: Record<string, string> = {};
  for (const m of memberRows ?? []) {
    const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
    if (profile) labelById[profile.id] = profile.display_name;
  }

  const expenses: ExpenseRow[] = (expenseRows ?? []).map((e) => {
    const payer = unwrapOne(
      e.profiles as { display_name: string } | { display_name: string }[] | null
    );
    return {
      id: e.id,
      groupId,
      description: e.description,
      amount: Number(e.amount),
      currency: e.currency,
      expenseDate: e.expense_date,
      paidByLabel: payer?.display_name ?? "?",
      createdBy: e.created_by,
      shares: (e.expense_participants ?? []).map((p) => ({
        userId: p.user_id,
        amount: Number(p.share_amount),
      })),
    };
  });

  const expenseInputs = (expenseRows ?? []).map((e) => ({
    paidBy: e.paid_by,
    currency: e.currency,
    amount: Number(e.amount),
    participants: (e.expense_participants ?? []).map((p) => ({
      userId: p.user_id,
      shareAmount: Number(p.share_amount),
    })),
  }));

  const settlementInputs = (settlementRows ?? []).map((s) => ({
    paidBy: s.paid_by,
    paidTo: s.paid_to,
    amount: Number(s.amount),
    currency: s.currency,
  }));

  const netByCurrency = computeNetBalances(expenseInputs, settlementInputs);
  const transactionsByCurrency = simplifyDebtsByCurrency(netByCurrency);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{group.name}</h1>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">{t.groups.balance}</h2>
        <BalanceSummary
          groupId={groupId}
          transactionsByCurrency={transactionsByCurrency}
          labelById={labelById}
          currentUserId={user!.id}
          t={t.balance}
        />
      </Card>

      <Link
        href={`/groups/${groupId}/stats`}
        className="block rounded-xl border border-border bg-white p-4 text-sm font-medium text-primary hover:shadow-md"
      >
        {t.stats.viewDetails}
      </Link>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">{t.groups.members}</h2>
        <MemberList members={members} pendingLabel={t.groups.pendingInvite} />
        <div className="mt-4 border-t border-border pt-4">
          <AddMemberForm groupId={groupId} t={t.groups} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">{t.groups.expenses}</h2>
          <div className="flex gap-2">
            <Link href={`/groups/${groupId}/import`}>
              <Button variant="secondary">{t.groups.importCsv}</Button>
            </Link>
            <Link href={`/groups/${groupId}/expenses/new`}>
              <Button variant="secondary">{t.groups.addExpense}</Button>
            </Link>
          </div>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted">{t.groups.noExpenses}</p>
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((e) => (
              <ExpenseListItem
                key={e.id}
                expense={e}
                currentUserId={user!.id}
                labelById={labelById}
                t={t.expenses}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
