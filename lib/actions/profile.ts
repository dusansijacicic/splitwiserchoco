"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/actions/groups";

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const { t } = await getDictionary();

  if (!displayName) return { error: t.profile.errorNameRequired };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user!.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { error: null };
}
