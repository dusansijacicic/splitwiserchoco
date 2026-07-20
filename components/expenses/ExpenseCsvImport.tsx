"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseCsv, readCsvFileText, type ParsedCsv } from "@/lib/csv";
import { importExpenses, type ImportRow } from "@/lib/actions/import";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type MemberOption = { userId: string; label: string; email: string };

const NONE = "__none__";

type PreviewRow = {
  index: number;
  raw: string[];
  description: string;
  amount: number | null;
  paidBy: string | null;
  currency: string;
  expenseDate: string;
  shares: { userId: string; amount: number }[] | null;
  error: string | null;
  included: boolean;
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
}: {
  groupId: string;
  members: MemberOption[];
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

  async function handleFile(file: File) {
    const text = await readCsvFileText(file);
    const csv = parseCsv(text);
    setParsed(csv);
    setResult(null);
    setExcluded(new Set());

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

      let shares: { userId: string; amount: number }[] | null = null;
      if (mappedShareCols.length > 0) {
        shares = mappedShareCols
          .map(([userId, col]) => ({
            userId,
            amount: Number((raw[Number(col)] ?? "0").replace(",", ".")),
          }))
          .filter((s) => Number.isFinite(s.amount) && s.amount > 0);
      }

      let error: string | null = null;
      if (!description) error = "Nedostaje opis";
      else if (!Number.isFinite(amount) || amount <= 0) error = "Neispravan iznos";
      else if (!paidBy) error = "Ne prepoznajem ko je platio";
      else if (shares && shares.length > 0) {
        const sum = shares.reduce((s, x) => s + x.amount, 0);
        if (Math.abs(sum - amount) > 0.02) error = "Zbir udela ne odgovara ukupnom iznosu";
      }

      return {
        index,
        raw,
        description,
        amount: Number.isFinite(amount) ? amount : null,
        paidBy,
        currency,
        expenseDate,
        shares,
        error,
        included: true,
      };
    });
  }, [parsed, ready, descCol, amountCol, paidByCol, dateCol, currencyCol, perPersonCols, members]);

  function toggleExcluded(index: number) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function handleImport() {
    const rows: ImportRow[] = preview
      .filter((r) => !r.error && !excluded.has(r.index))
      .map((r) => ({
        description: r.description,
        amount: r.amount!,
        currency: r.currency,
        paidBy: r.paidBy!,
        expenseDate: r.expenseDate || new Date().toISOString().slice(0, 10),
        mode: r.shares && r.shares.length > 0 ? "exact" : "equal",
        shares: r.shares ?? undefined,
        participantIds: r.shares ? undefined : members.map((m) => m.userId),
      }));

    startTransition(async () => {
      const res = await importExpenses(groupId, rows);
      setResult(res);
      if (res.errors.length === 0) {
        router.push(`/groups/${groupId}`);
      }
    });
  }

  const validCount = preview.filter((r) => !r.error && !excluded.has(r.index)).length;

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-muted">CSV fajl</label>
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
          <p className="text-sm font-medium text-muted">Mapiranje kolona</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ColumnSelect label="Opis" headers={parsed.headers} value={descCol} onChange={setDescCol} />
            <ColumnSelect label="Ukupan iznos" headers={parsed.headers} value={amountCol} onChange={setAmountCol} />
            <ColumnSelect label="Ko je platio" headers={parsed.headers} value={paidByCol} onChange={setPaidByCol} />
            <ColumnSelect label="Datum (opciono)" headers={parsed.headers} value={dateCol} onChange={setDateCol} optional />
            <ColumnSelect label="Valuta (opciono)" headers={parsed.headers} value={currencyCol} onChange={setCurrencyCol} optional />
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-muted">
              Kolone sa tačnim iznosom po osobi (opciono — ako ih ne mapiraš, koristi se ravnomerna podela)
            </p>
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
            Pregled ({validCount} od {preview.length} redova spremno za uvoz)
          </p>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="py-1 pr-2"></th>
                  <th className="py-1 pr-2">Opis</th>
                  <th className="py-1 pr-2">Iznos</th>
                  <th className="py-1 pr-2">Platio</th>
                  <th className="py-1 pr-2">Podela</th>
                  <th className="py-1 pr-2"></th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r) => (
                  <tr key={r.index} className="border-t border-border">
                    <td className="py-1 pr-2">
                      <input
                        type="checkbox"
                        checked={!excluded.has(r.index)}
                        disabled={!!r.error}
                        onChange={() => toggleExcluded(r.index)}
                      />
                    </td>
                    <td className="py-1 pr-2">{r.description || "—"}</td>
                    <td className="py-1 pr-2">
                      {r.amount != null ? `${r.amount.toFixed(2)} ${r.currency}` : "—"}
                    </td>
                    <td className="py-1 pr-2">
                      {members.find((m) => m.userId === r.paidBy)?.label ?? "—"}
                    </td>
                    <td className="py-1 pr-2">
                      {r.shares && r.shares.length > 0 ? "tačno po osobi" : "ravnomerno"}
                    </td>
                    <td className="py-1 pr-2 text-danger">{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleImport} disabled={pending || validCount === 0}>
              {pending ? "Uvoženje..." : `Uvezi ${validCount} troškova`}
            </Button>
            {result && result.errors.length > 0 && (
              <span className="text-sm text-danger">
                {result.successCount} uspešno, {result.errors.length} sa greškom
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
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border px-2 py-1.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      >
        {optional && <option value={NONE}>—</option>}
        {!optional && <option value={NONE}>Izaberi kolonu</option>}
        {headers.map((h, i) => (
          <option key={i} value={String(i)}>
            {h}
          </option>
        ))}
      </select>
    </div>
  );
}
