import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user!.id)
    .single();

  return (
    <Card className="mx-auto max-w-md p-6">
      <h1 className="mb-4 text-lg font-semibold">Profil</h1>
      <ProfileForm
        email={profile?.email ?? user!.email ?? ""}
        displayName={profile?.display_name ?? ""}
      />
    </Card>
  );
}
