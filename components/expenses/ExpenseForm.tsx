"use client";

import { useActionState, useMemo, useState } from "react";
import { createExpense } from "@/lib/actions/expenses";
import type { ActionState } from "@/lib/actions/groups";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export type MemberOption = { userId: string; label: string };

const initialState: ActionState = { error: null };

export function ExpenseForm({
  groupId,
  members,
}: {
  groupId: string;
  members: MemberOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createExpense.bind(null, groupId),
    initialState
  );
  const [selected, setSelected] = useState<Set<string>>(
    new Set(members.map((m) => m.userId))
  );
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [amount, setAmount] = useState("");
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  function toggle(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const selectedMembers = members.filter((m) => selected.has(m.userId));

  const customTotal = useMemo(
    () =>
      selectedMembers.reduce((sum, m) => sum + (Number(customShares[m.userId]) || 0), 0),
    [selectedMembers, customShares]
  );
  const amountNum = Number(amount) || 0;
  const customDiff = Math.round((amountNum - customTotal) * 100) / 100;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">Opis</label>
        <Input type="text" name="description" required placeholder="npr. Market" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted">Iznos</label>
          <Input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted">Valuta</label>
          <Input type="text" name="currency" defaultValue="EUR" maxLength={8} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Datum</label>
        <Input
          type="date"
          name="expenseDate"
          defaultValue={new Date().toISOString().slice(0, 10)}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Ko je platio</label>
        <select
          name="paidBy"
          required
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        >
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Podeli između</label>
        <div className="space-y-1">
          {members.map((m) => (
            <label key={m.userId} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="participants"
                value={m.userId}
                checked={selected.has(m.userId)}
                onChange={() => toggle(m.userId)}
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted">Način podele</label>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="splitMode"
              value="equal"
              checked={splitMode === "equal"}
              onChange={() => setSplitMode("equal")}
            />
            Ravnomerno
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              name="splitMode"
              value="custom"
              checked={splitMode === "custom"}
              onChange={() => setSplitMode("custom")}
            />
            Prilagođeno
          </label>
        </div>
      </div>

      {splitMode === "custom" && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          {selectedMembers.length === 0 ? (
            <p className="text-sm text-muted">Izaberi bar jednog učesnika iznad.</p>
          ) : (
            selectedMembers.map((m) => (
              <div key={m.userId} className="flex items-center justify-between gap-2">
                <span className="text-sm">{m.label}</span>
                <Input
                  type="number"
                  name={`share_${m.userId}`}
                  step="0.01"
                  min="0"
                  className="w-28"
                  value={customShares[m.userId] ?? ""}
                  onChange={(e) =>
                    setCustomShares((prev) => ({ ...prev, [m.userId]: e.target.value }))
                  }
                />
              </div>
            ))
          )}
          {selectedMembers.length > 0 && (
            <p
              className={`text-xs ${Math.abs(customDiff) < 0.005 ? "text-owed" : "text-danger"}`}
            >
              {Math.abs(customDiff) < 0.005
                ? "Zbir se poklapa sa ukupnim iznosom."
                : `Razlika: ${customDiff.toFixed(2)} (uneto ${customTotal.toFixed(2)} od ${amountNum.toFixed(2)})`}
            </p>
          )}
        </div>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Dodavanje..." : "Dodaj trošak"}
      </Button>
    </form>
  );
}
