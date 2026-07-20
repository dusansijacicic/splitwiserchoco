import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      <h1 className="text-xl font-semibold">Dobrodošao/la, {user?.email}</h1>
      <p className="mt-2 text-muted">Tvoje grupe će se pojaviti ovde.</p>
    </div>
  );
}
