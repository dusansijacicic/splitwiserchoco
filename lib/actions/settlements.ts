"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/groups";

export async function createSettlement(
  groupId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const paidBy = String(formData.get("paidBy") ?? "");
  const paidTo = String(formData.get("paidTo") ?? "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "EUR").trim() || "EUR";

  if (!paidBy || !paidTo) return { error: "Izaberi ko plaća i ko prima." };
  if (paidBy === paidTo) return { error: "Osoba ne može da plati sama sebi." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Iznos mora biti veći od 0." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("settlements").insert({
    group_id: groupId,
    paid_by: paidBy,
    paid_to: paidTo,
    amount,
    currency,
    created_by: user!.id,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(`/groups/${groupId}`);
}
