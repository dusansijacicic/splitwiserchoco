"use client";

import { useActionState } from "react";
import { createSettlement } from "@/lib/actions/settlements";
import type { ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/lib/i18n/dictionaries";

// Excludes the server-only interpolation function (title) — Client
// Components can't receive functions as props from Server Components.
export type SettleUpLabels = Omit<Dictionary["settleUp"], "title">;

const initialState: ActionState = { error: null };

export function SettleUpForm({
  groupId,
  members,
  defaultFrom,
  defaultTo,
  defaultAmount,
  defaultCurrency,
  t,
}: {
  groupId: string;
  members: { userId: string; label: string }[];
  defaultFrom?: string;
  defaultTo?: string;
  defaultAmount?: string;
  defaultCurrency?: string;
  t: SettleUpLabels;
}) {
  const [state, formAction, pending] = useActionState(
    createSettlement.bind(null, groupId),
    initialState
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-sm text-muted">{t.payer}</label>
        <select
          name="paidBy"
          defaultValue={defaultFrom}
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">{t.pick}</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">{t.receiver}</label>
        <select
          name="paidTo"
          defaultValue={defaultTo}
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          <option value="">{t.pick}</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted">{t.amount}</label>
          <Input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            defaultValue={defaultAmount}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">{t.currency}</label>
          <Input type="text" name="currency" defaultValue={defaultCurrency ?? "EUR"} maxLength={8} />
        </div>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
