"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/groups";

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!displayName) return { error: "Ime je obavezno." };

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
