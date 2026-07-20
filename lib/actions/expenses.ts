"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import type { ActionState } from "@/lib/actions/groups";

type ParsedExpenseForm =
  | { ok: true; description: string; amount: number; currency: string; paidBy: string; expenseDate: string; shares: { user_id: string; share_amount: number }[] }
  | { ok: false; error: string };

async function parseExpenseForm(formData: FormData): Promise<ParsedExpenseForm> {
  const { t } = await getDictionary();
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "EUR").trim() || "EUR";
  const paidBy = String(formData.get("paidBy") ?? "");
  const expenseDate =
    String(formData.get("expenseDate") ?? "") || new Date().toISOString().slice(0, 10);
  const splitMode = String(formData.get("splitMode") ?? "equal");
  const participantIds = formData.getAll("participants").map(String);

  if (!description) return { ok: false, error: t.expenses.errorDescriptionRequired };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: t.expenses.errorAmountPositive };
  }
  if (!paidBy) return { ok: false, error: t.expenses.errorPaidByRequired };
  if (participantIds.length === 0) {
    return { ok: false, error: t.expenses.errorParticipantsRequired };
  }

  let shares: { user_id: string; share_amount: number }[];
  if (splitMode === "custom") {
    shares = participantIds.map((userId) => ({
      user_id: userId,
      share_amount: Number(formData.get(`share_${userId}`)),
    }));
    if (shares.some((s) => !Number.isFinite(s.share_amount) || s.share_amount < 0)) {
      return { ok: false, error: t.expenses.errorShareNonNegative };
    }
  } else {
    const base = Math.floor((amount / participantIds.length) * 100) / 100;
    const remainderCents = Math.round((amount - base * participantIds.length) * 100);
    shares = participantIds.map((userId, i) => ({
      user_id: userId,
      share_amount: base + (i < remainderCents ? 0.01 : 0),
    }));
  }

  const sum = shares.reduce((s, x) => s + x.share_amount, 0);
  if (Math.abs(sum - amount) > 0.02) {
    return {
      ok: false,
      error: t.expenses.errorShareSumMismatch(sum.toFixed(2), amount.toFixed(2)),
    };
  }

  return { ok: true, description, amount, currency, paidBy, expenseDate, shares };
}

export async function createExpense(
  groupId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = await parseExpenseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_expense_with_exact_shares", {
    p_group_id: groupId,
    p_description: parsed.description,
    p_amount: parsed.amount,
    p_currency: parsed.currency,
    p_paid_by: parsed.paidBy,
    p_expense_date: parsed.expenseDate,
    p_shares: parsed.shares,
  });

  if (error) return { error: error.message };

  redirect(`/groups/${groupId}`);
}

export async function updateExpense(
  groupId: string,
  expenseId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = await parseExpenseForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_expense_with_shares", {
    p_expense_id: expenseId,
    p_description: parsed.description,
    p_amount: parsed.amount,
    p_currency: parsed.currency,
    p_paid_by: parsed.paidBy,
    p_expense_date: parsed.expenseDate,
    p_shares: parsed.shares,
  });

  if (error) return { error: error.message };

  redirect(`/groups/${groupId}`);
}
