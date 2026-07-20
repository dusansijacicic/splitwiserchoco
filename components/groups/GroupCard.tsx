import Link from "next/link";
import { Card } from "@/components/ui/Card";

export function GroupCard({
  id,
  name,
  memberCountLabel,
}: {
  id: string;
  name: string;
  memberCountLabel: string;
}) {
  return (
    <Link href={`/groups/${id}`}>
      <Card className="p-4 transition-shadow hover:shadow-md">
        <p className="font-medium">{name}</p>
        <p className="mt-1 text-sm text-muted">{memberCountLabel}</p>
      </Card>
    </Link>
  );
}
