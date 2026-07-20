import { Avatar } from "@/components/ui/Avatar";

export type MemberRow = {
  id: string;
  label: string;
  pending: boolean;
};

export function MemberList({
  members,
  pendingLabel,
}: {
  members: MemberRow[];
  pendingLabel: string;
}) {
  return (
    <ul className="space-y-2">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-3">
          <Avatar name={m.label} size={28} />
          <span className="text-sm">
            {m.label}
            {m.pending && <span className="ml-2 text-xs text-muted">{pendingLabel}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
