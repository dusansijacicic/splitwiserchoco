import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne, type Profile } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { MemberList, type MemberRow } from "@/components/groups/MemberList";
import { AddMemberForm } from "@/components/groups/AddMemberForm";

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

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("id, user_id, invited_email, profiles(id, email, display_name)")
    .eq("group_id", groupId);

  const members: MemberRow[] = (memberRows ?? []).map((m) => {
    const profile = unwrapOne(m.profiles as Profile | Profile[] | null);
    return {
      id: m.id,
      label: profile?.display_name ?? m.invited_email ?? "Nepoznat",
      pending: profile === null,
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
        <h2 className="mb-3 text-sm font-medium text-muted">Troškovi</h2>
        <p className="text-sm text-muted">Uskoro — dodavanje i pregled troškova.</p>
      </Card>
    </div>
  );
}
