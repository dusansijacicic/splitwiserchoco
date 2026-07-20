"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

export type ImportRow = {
  description: string;
  amount: number;
  currency: string;
  paidBy: string;
  expenseDate: string;
  mode: "equal" | "exact";
  participantIds?: string[];
  shares?: { userId: string; amount: number }[];
};

export type ImportResult = { successCount: number; errors: string[] };

export async function importExpenses(
  groupId: string,
  rows: ImportRow[]
): Promise<ImportResult> {
  const supabase = await createClient();
  const { t } = await getDictionary();
  let successCount = 0;
  const errors: string[] = [];

  for (const [index, row] of rows.entries()) {
    const { error } =
      row.mode === "exact"
        ? await supabase.rpc("create_expense_with_exact_shares", {
            p_group_id: groupId,
            p_description: row.description,
            p_amount: row.amount,
            p_currency: row.currency,
            p_paid_by: row.paidBy,
            p_expense_date: row.expenseDate,
            p_shares: (row.shares ?? []).map((s) => ({
              user_id: s.userId,
              share_amount: s.amount,
            })),
          })
        : await supabase.rpc("create_expense_with_splits", {
            p_group_id: groupId,
            p_description: row.description,
            p_amount: row.amount,
            p_currency: row.currency,
            p_paid_by: row.paidBy,
            p_expense_date: row.expenseDate,
            p_participant_ids: row.participantIds ?? [],
          });

    if (error) {
      errors.push(`${t.csvImport.rowLabel} ${index + 1} (${row.description}): ${error.message}`);
    } else {
      successCount++;
    }
  }

  revalidatePath(`/groups/${groupId}`);
  return { successCount, errors };
}
