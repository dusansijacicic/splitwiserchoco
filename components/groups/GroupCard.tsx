import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function GroupCard({
  id,
  name,
  memberCount,
}: {
  id: string;
  name: string;
  memberCount: number;
}) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <p className="font-medium">{name}</p>
        <p className="mt-1 text-sm text-muted">
          {memberCount} {memberCount === 1 ? "član" : "članova"}
        </p>
      </Card>
    </Link>
  );
}
