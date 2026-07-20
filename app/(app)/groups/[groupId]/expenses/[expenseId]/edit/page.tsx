import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ExpenseForm, type MemberOption } from "@/components/expenses/ExpenseForm";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ groupId: string; expenseId: string }>;
}) {
  const { groupId, expenseId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: group }, { data: expense }, { data: memberRows }] = await Promise.all([
    supabase.from("groups").select("id, name").eq("id", groupId).single(),
    supabase
      .from("expenses")
      .select(
        "id, description, amount, currency, expense_date, paid_by, created_by, expense_participants(user_id, share_amount)"
      )
      .eq("id", expenseId)
      .eq("group_id", groupId)
      .single(),
    supabase
      .from("group_members")
      .select("user_id, profiles(id, email, display_name)")
      .eq("group_id", groupId)
      .not("user_id", "is", null),
  ]);

  if (!group || !expense) {
    notFound();
  }

  const members: MemberOption[] = (memberRows ?? [])
    .map((m) => {
      const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
      return profile ? { userId: profile.id, label: profile.display_name } : null;
    })
    .filter((m): m is MemberOption => m !== null);

  if (expense.created_by !== user!.id) {
    return (
      <Card className="mx-auto max-w-md p-6">
        <h1 className="mb-2 text-lg font-semibold">Nemaš dozvolu</h1>
        <p className="text-sm text-muted">
          Samo osoba koja je dodala ovaj trošak može da ga izmeni.
        </p>
      </Card>
    );
  }

  const shares: Record<string, number> = {};
  for (const p of expense.expense_participants ?? []) {
    shares[p.user_id] = Number(p.share_amount);
  }

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">Izmeni trošak u grupi {group.name}</h1>
      <ExpenseForm
        groupId={groupId}
        expenseId={expenseId}
        members={members}
        defaults={{
          description: expense.description,
          amount: Number(expense.amount),
          currency: expense.currency,
          expenseDate: expense.expense_date,
          paidBy: expense.paid_by,
          shares,
        }}
      />
    </Card>
  );
}
