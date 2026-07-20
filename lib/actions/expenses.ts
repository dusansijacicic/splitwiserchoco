"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/actions/groups";

export async function createExpense(
  groupId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "EUR").trim() || "EUR";
  const paidBy = String(formData.get("paidBy") ?? "");
  const expenseDate = String(formData.get("expenseDate") ?? "");
  const splitMode = String(formData.get("splitMode") ?? "equal");
  const participantIds = formData.getAll("participants").map(String);

  if (!description) return { error: "Opis je obavezan." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Iznos mora biti veći od 0." };
  }
  if (!paidBy) return { error: "Izaberi ko je platio." };
  if (participantIds.length === 0) {
    return { error: "Izaberi bar jednog učesnika u podeli." };
  }

  const supabase = await createClient();
  const expenseDateValue = expenseDate || new Date().toISOString().slice(0, 10);

  if (splitMode === "custom") {
    const shares = participantIds.map((userId) => ({
      user_id: userId,
      share_amount: Number(formData.get(`share_${userId}`)),
    }));

    if (shares.some((s) => !Number.isFinite(s.share_amount) || s.share_amount < 0)) {
      return { error: "Svaki udeo mora biti broj veći ili jednak 0." };
    }

    const sum = shares.reduce((s, x) => s + x.share_amount, 0);
    if (Math.abs(sum - amount) > 0.02) {
      return {
        error: `Zbir udela (${sum.toFixed(2)}) ne odgovara ukupnom iznosu (${amount.toFixed(2)}).`,
      };
    }

    const { error } = await supabase.rpc("create_expense_with_exact_shares", {
      p_group_id: groupId,
      p_description: description,
      p_amount: amount,
      p_currency: currency,
      p_paid_by: paidBy,
      p_expense_date: expenseDateValue,
      p_shares: shares,
    });

    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.rpc("create_expense_with_splits", {
      p_group_id: groupId,
      p_description: description,
      p_amount: amount,
      p_currency: currency,
      p_paid_by: paidBy,
      p_expense_date: expenseDateValue,
      p_participant_ids: participantIds,
    });

    if (error) return { error: error.message };
  }

  redirect(`/groups/${groupId}`);
}
