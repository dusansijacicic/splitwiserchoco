import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ExpenseCsvImport, type MemberOption } from "@/components/expenses/ExpenseCsvImport";

export default async function ImportExpensesPage({
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
      return profile
        ? { userId: profile.id, label: profile.display_name, email: profile.email }
        : null;
    })
    .filter((m): m is MemberOption => m !== null);

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-lg font-semibold">Uvoz troškova iz CSV-a</h1>
      <p className="mb-4 text-sm text-muted">
        Grupa: {group.name}. Otpremi CSV izvezen iz Excel-a/Google Sheets-a i mapiraj kolone.
      </p>
      <ExpenseCsvImport groupId={groupId} members={members} />
    </Card>
  );
}
