"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseCsv, readCsvFileText, type ParsedCsv } from "@/lib/csv";
import { importExpenses, type ImportRow } from "@/lib/actions/import";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type MemberOption = { userId: string; label: string; email: string };

const NONE = "__none__";

type PreviewRow = {
  index: number;
  description: string;
  amount: number | null;
  paidBy: string | null;
  currency: string;
  expenseDate: string;
  defaultShares: Record<string, number>;
  error: string | null;
};

function resolveMember(value: string, members: MemberOption[]): string | null {
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  const match = members.find(
    (m) => m.label.toLowerCase() === needle || m.email.toLowerCase() === needle
  );
  return match?.userId ?? null;
}

export function ExpenseCsvImport({
  groupId,
  members,
  t,
}: {
  groupId: string;
  members: MemberOption[];
  t: Dictionary["csvImport"];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [descCol, setDescCol] = useState(NONE);
  const [amountCol, setAmountCol] = useState(NONE);
  const [paidByCol, setPaidByCol] = useState(NONE);
  const [dateCol, setDateCol] = useState(NONE);
  const [currencyCol, setCurrencyCol] = useState(NONE);
  const [perPersonCols, setPerPersonCols] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ successCount: number; errors: string[] } | null>(
    null
  );
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  // rowShares[rowIndex][memberUserId] = editable input value (string)
  const [rowShares, setRowShares] = useState<Record<number, Record<string, string>>>({});

  async function handleFile(file: File) {
    const text = await readCsvFileText(file);
    const csv = parseCsv(text);
    setParsed(csv);
    setResult(null);
    setExcluded(new Set());
    setRowShares({});

    // best-effort auto-guess based on common header names
    csv.headers.forEach((h, i) => {
      const lower = h.trim().toLowerCase();
      if (["expence", "expense", "description", "opis"].includes(lower)) setDescCol(String(i));
      if (["total amount", "amount", "iznos", "ukupno"].includes(lower)) setAmountCol(String(i));
      if (["paid by", "paidby", "platio"].includes(lower)) setPaidByCol(String(i));
      if (["date", "datum"].includes(lower)) setDateCol(String(i));
      if (["currency", "valuta"].includes(lower)) setCurrencyCol(String(i));
    });
  }

  const ready = descCol !== NONE && amountCol !== NONE && paidByCol !== NONE;

  const preview: PreviewRow[] = useMemo(() => {
    if (!parsed || !ready) return [];
    const di = Number(descCol);
    const ai = Number(amountCol);
    const pi = Number(paidByCol);
    const dti = dateCol !== NONE ? Number(dateCol) : null;
    const ci = currencyCol !== NONE ? Number(currencyCol) : null;
    const mappedShareCols = Object.entries(perPersonCols).filter(([, col]) => col !== NONE);

    return parsed.rows.map((raw, index) => {
      const description = (raw[di] ?? "").trim();
      const amount = Number((raw[ai] ?? "").replace(",", "."));
      const paidBy = resolveMember(raw[pi] ?? "", members);
      const currency = ci !== null ? (raw[ci] ?? "EUR").trim() || "EUR" : "EUR";
      const expenseDate = dti !== null ? (raw[dti] ?? "").trim() : "";

      const defaultShares: Record<string, number> = {};
      if (mappedShareCols.length > 0) {
        for (const [userId, col] of mappedShareCols) {
          defaultShares[userId] = Number((raw[Number(col)] ?? "0").replace(",", ".")) || 0;
        }
      } else if (Number.isFinite(amount) && members.length > 0) {
        const equalShare = Math.round((amount / members.length) * 100) / 100;
        for (const m of members) defaultShares[m.userId] = equalShare;
      }

      let error: string | null = null;
      if (!description) error = t.errorMissingDescription;
      else if (!Number.isFinite(amount) || amount <= 0) error = t.errorInvalidAmount;
      else if (!paidBy) error = t.errorUnrecognizedPayer;

      return {
        index,
        description,
        amount: Number.isFinite(amount) ? amount : null,
        paidBy,
        currency,
        expenseDate,
        defaultShares,
        error,
      };
    });
  }, [parsed, ready, descCol, amountCol, paidByCol, dateCol, currencyCol, perPersonCols, members, t]);

  // (Re)initialize editable shares whenever the underlying mapping/file changes,
  // without clobbering edits the user makes afterward. `preview` is a stable
  // reference between keystrokes (only the useMemo deps above change it), so
  // comparing identity against the last-seen preview tells us when to reset —
  // done during render per React's "adjusting state" pattern, not in an effect.
  const [lastPreview, setLastPreview] = useState<PreviewRow[] | null>(null);
  if (preview !== lastPreview) {
    setLastPreview(preview);
    const next: Record<number, Record<string, string>> = {};
    for (const row of preview) {
      next[row.index] = Object.fromEntries(
        members.map((m) => [m.userId, String(row.defaultShares[m.userId] ?? 0)])
      );
    }
    setRowShares(next);
  }

  function setShare(rowIndex: number, userId: string, value: string) {
    setRowShares((prev) => ({
      ...prev,
      [rowIndex]: { ...prev[rowIndex], [userId]: value },
    }));
  }

  function rowTotal(rowIndex: number): number {
    const shares = rowShares[rowIndex] ?? {};
    return Object.values(shares).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }

  function toggleExcluded(index: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function rowError(row: PreviewRow): string | null {
    if (row.error) return row.error;
    if (row.amount != null && Math.abs(rowTotal(row.index) - row.amount) > 0.02) {
      return t.errorSumMismatch;
    }
    return null;
  }

  const validCount = preview.filter((r) => !rowError(r) && !excluded.has(r.index)).length;

  function handleImport() {
    const rows: ImportRow[] = preview
      .filter((r) => !rowError(r) && !excluded.has(r.index))
      .map((r) => {
        const shares = members
          .map((m) => ({ userId: m.userId, amount: Number(rowShares[r.index]?.[m.userId]) || 0 }))
          .filter((s) => s.amount > 0);
        return {
          description: r.description,
          amount: r.amount!,
          currency: r.currency,
          paidBy: r.paidBy!,
          expenseDate: r.expenseDate || new Date().toISOString().slice(0, 10),
          mode: "exact" as const,
          shares,
        };
      });

    startTransition(async () => {
      const res = await importExpenses(groupId, rows);
      setResult(res);
      if (res.errors.length === 0) {
        router.push(`/groups/${groupId}`);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">{t.file}</label>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-sm"
        />
      </div>

      {parsed && (
        <Card className="space-y-3 p-4">
          <p className="text-sm font-medium text-muted">{t.columnMapping}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ColumnSelect label={t.description} headers={parsed.headers} value={descCol} onChange={setDescCol} none={t.none} pick={t.pickColumn} />
            <ColumnSelect label={t.totalAmount} headers={parsed.headers} value={amountCol} onChange={setAmountCol} none={t.none} pick={t.pickColumn} />
            <ColumnSelect label={t.paidBy} headers={parsed.headers} value={paidByCol} onChange={setPaidByCol} none={t.none} pick={t.pickColumn} />
            <ColumnSelect label={t.dateOptional} headers={parsed.headers} value={dateCol} onChange={setDateCol} none={t.none} pick={t.pickColumn} optional />
            <ColumnSelect label={t.currencyOptional} headers={parsed.headers} value={currencyCol} onChange={setCurrencyCol} none={t.none} pick={t.pickColumn} optional />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-muted">{t.perPersonHint}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {members.map((m) => (
                <ColumnSelect
                  key={m.userId}
                  label={m.label}
                  headers={parsed.headers}
                  value={perPersonCols[m.userId] ?? NONE}
                  onChange={(v) =>
                    setPerPersonCols((prev) => ({ ...prev, [m.userId]: v }))
                  }
                  none={t.none}
                  pick={t.pickColumn}
                  optional
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {ready && preview.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-sm font-medium text-muted">
            {t.previewSummary(validCount, preview.length)}
          </p>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="py-1 pr-2"></th>
                  <th className="py-1 pr-2">{t.colDescription}</th>
                  <th className="py-1 pr-2">{t.colAmount}</th>
                  <th className="py-1 pr-2">{t.colPaidBy}</th>
                  {members.map((m) => (
                    <th key={m.userId} className="py-1 pr-2">
                      {m.label}
                    </th>
                  ))}
                  <th className="py-1 pr-2"></th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => {
                  const err = rowError(r);
                  return (
                    <tr key={r.index} className="border-t border-border align-top">
                      <td className="py-1 pr-2">
                        <input
                          type="checkbox"
                          checked={!excluded.has(r.index)}
                          disabled={!!r.error}
                          onChange={() => toggleExcluded(r.index)}
                        />
                      </td>
                      <td className="py-1 pr-2 whitespace-nowrap">{r.description || "—"}</td>
                      <td className="py-1 pr-2 whitespace-nowrap">
                        {r.amount != null ? `${r.amount.toFixed(2)} ${r.currency}` : "—"}
                      </td>
                      <td className="py-1 pr-2 whitespace-nowrap">
                        {members.find((m) => m.userId === r.paidBy)?.label ?? "—"}
                      </td>
                      {members.map((m) => (
                        <td key={m.userId} className="py-1 pr-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-24"
                            value={rowShares[r.index]?.[m.userId] ?? "0"}
                            onChange={(e) => setShare(r.index, m.userId, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="py-1 pr-2 text-danger whitespace-nowrap">{err}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleImport} disabled={pending || validCount === 0}>
              {pending ? t.importing : t.importButton(validCount)}
            </Button>
            {result && result.errors.length > 0 && (
              <span className="text-sm text-danger">
                {t.resultSummary(result.successCount, result.errors.length)}
              </span>
            )}
          </div>
          {result?.errors.map((e, i) => (
            <p key={i} className="mt-1 text-xs text-danger">
              {e}
            </p>
          ))}
        </Card>
      )}
    </div>
  );
}

function ColumnSelect({
  label,
  headers,
  value,
  onChange,
  optional,
  none,
  pick,
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  none: string;
  pick: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {optional && <option value={NONE}>{none}</option>}
        {!optional && <option value={NONE}>{pick}</option>}
        {headers.map((h, i) => (
          <option key={i} value={String(i)}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
