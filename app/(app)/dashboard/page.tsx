import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { unwrapOne } from "@/lib/types";
import { getDictionary } from "@/lib/i18n/server";
import { GroupCard } from "@/components/groups/GroupCard";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { t } = await getDictionary();

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name)")
    .eq("user_id", user!.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  const { data: counts } = groupIds.length
    ? await supabase
        .from("group_members")
        .select("group_id")
        .in("group_id", groupIds)
    : { data: [] as { group_id: string }[] };

  const memberCountByGroup = (counts ?? []).reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.group_id] = (acc[row.group_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  type GroupRow = { id: string; name: string };
  const groups = (memberships ?? [])
    .map((m) => unwrapOne(m.groups as GroupRow | GroupRow[] | null))
    .filter((g): g is GroupRow => g != null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.dashboard.title}</h1>
        <Link href="/groups/new">
          <Button>{t.dashboard.newGroup}</Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted">{t.dashboard.empty}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              id={g.id}
              name={g.name}
              memberCountLabel={t.dashboard.memberCount(memberCountByGroup[g.id] ?? 1)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
