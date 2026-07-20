import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MemberList, type MemberRow } from "@/components/groups/MemberList";
import { AddMemberForm } from "@/components/groups/AddMemberForm";
import { ExpenseListItem, type ExpenseRow } from "@/components/expenses/ExpenseListItem";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createClient();

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
      .select("id, user_id, invited_email, profiles(id, email, display_name)")
      .eq("group_id", groupId),
    supabase
      .from("expenses")
      .select("id, description, amount, currency, expense_date, paid_by, profiles!expenses_paid_by_fkey(display_name)")
      .eq("group_id", groupId)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const members: MemberRow[] = (memberRows ?? []).map((m) => {
    const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
    return {
      id: m.id,
      label: profile?.display_name ?? m.invited_email ?? "Nepoznat",
      pending: profile === null,
    };
  });

  const expenses: ExpenseRow[] = (expenseRows ?? []).map((e) => {
    const payer = unwrapOne(
      e.profiles as { display_name: string } | { display_name: string }[] | null
    );
    return {
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      currency: e.currency,
      expenseDate: e.expense_date,
      paidByLabel: payer?.display_name ?? "?",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{group.name}</h1>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-sm font-medium text-muted">Članovi</h2>
        <MemberList members={members} />
        <div className="mt-4 border-t border-border pt-4">
          <AddMemberForm groupId={groupId} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Troškovi</h2>
          <Link href={`/groups/${groupId}/expenses/new`}>
            <Button variant="secondary">+ Dodaj trošak</Button>
          </Link>
        </div>
        {expenses.length === 0 ? (
          <p className="text-sm text-muted">Još nema troškova u ovoj grupi.</p>
        ) : (
          <ul className="divide-y divide-border">
            {expenses.map((e) => (
              <ExpenseListItem key={e.id} expense={e} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
