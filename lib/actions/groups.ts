"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

export type ActionState = { error: string | null };

export async function createGroup(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    const { t } = await getDictionary();
    return { error: t.groups.errorGroupNameRequired };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", {
    group_name: name,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/groups/${data.id}`);
}

export async function addMember(
  groupId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    const { t } = await getDictionary();
    return { error: t.groups.errorEmailRequired };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_member_by_email", {
    p_group_id: groupId,
    p_email: email,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/groups/${groupId}`);
  return { error: null };
}
