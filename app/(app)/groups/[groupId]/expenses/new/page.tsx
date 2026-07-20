import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ExpenseForm, type MemberOption } from "@/components/expenses/ExpenseForm";

export default async function NewExpensePage({
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

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("user_id, profiles(id, email, display_name)")
    .eq("group_id", groupId)
    .not("user_id", "is", null);

  const members: MemberOption[] = (memberRows ?? [])
    .map((m) => {
      const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
      return profile ? { userId: profile.id, label: profile.display_name } : null;
    })
    .filter((m): m is MemberOption => m !== null);

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">Novi trošak u grupi {group.name}</h1>
      <ExpenseForm groupId={groupId} members={members} />
    </Card>
  );
}
