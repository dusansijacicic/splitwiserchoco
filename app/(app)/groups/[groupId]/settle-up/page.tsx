import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { SettleUpForm } from "@/components/balances/SettleUpForm";

export default async function SettleUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<{ from?: string; to?: string; amount?: string; currency?: string }>;
}) {
  const { groupId } = await params;
  const query = await searchParams;
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
    .select("user_id, profiles(id, display_name)")
    .eq("group_id", groupId)
    .not("user_id", "is", null);

  const members = (memberRows ?? [])
    .map((m) => {
      const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
      return profile ? { userId: profile.id, label: profile.display_name } : null;
    })
    .filter((m): m is { userId: string; label: string } => m !== null);

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">Poravnaj dug u grupi {group.name}</h1>
      <SettleUpForm
        groupId={groupId}
        members={members}
        defaultFrom={query.from}
        defaultTo={query.to}
        defaultAmount={query.amount}
        defaultCurrency={query.currency}
      />
    </Card>
  );
}
