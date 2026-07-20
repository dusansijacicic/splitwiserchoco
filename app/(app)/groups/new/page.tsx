import { getDictionary } from "@/lib/i18n/server";
import { Card } from "@/components/ui/Card";
import { NewGroupForm } from "@/components/groups/NewGroupForm";

export default async function NewGroupPage() {
  const { t } = await getDictionary();

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">{t.groups.newGroupTitle}</h1>
      <NewGroupForm t={t.groups} />
    </Card>
  );
}
