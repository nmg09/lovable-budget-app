import { useState, useCallback, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Upload, Check, AlertCircle } from "lucide-react";
import { useAppStore } from "@/lib/store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "map" | "preview" | "done";

const MAPPABLE_FIELDS = [
  "date",
  "merchant",
  "amount",
  "debit",
  "credit",
  "category",
  "ignore",
] as const;
type MappableField = (typeof MAPPABLE_FIELDS)[number];

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else current += ch;
    }
    result.push(current.trim());
    return result;
  });
}

// Safer fingerprint than "entire row", and independent of CSV column order
function fingerprint(tx: {
  accountId: string;
  date: string;
  merchant: string;
  amount: number;
}) {
  const m = tx.merchant.toLowerCase().replace(/\s+/g, " ").trim();
  const a = Math.round(tx.amount * 100); // cents
  return `${tx.accountId}|${tx.date}|${a}|${m}`;
}

function cleanNumber(v: string) {
  return Number(String(v ?? "").replace(/[^0-9.\-]/g, "")) || 0;
}

export function CsvImportSheet({ open, onOpenChange }: Props) {
  const accounts = useAppStore((s) => s.accounts);
  const addTransaction = useAppStore((s) => s.addTransaction);
  const transactions = useAppStore((s) => s.transactions);

  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<number, MappableField>>({});
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");

  const [preview, setPreview] = useState<
    Array<{
      date: string;
      merchant: string;
      amount: number;
      categoryId: string;
      fp: string;
    }>
  >([]);

  const [dupeCount, setDupeCount] = useState(0);
  const [importCount, setImportCount] = useState(0);

  const existingFPs = useMemo(() => {
    const setFP = new Set<string>();
    for (const t of transactions) {
      setFP.add(
        fingerprint({
          accountId: t.accountId,
          date: t.date,
          merchant: t.merchant,
          amount: t.amount,
        })
      );
    }
    return setFP;
  }, [transactions]);

  const reset = () => {
    setStep("upload");
    setRows([]);
    setHeaders([]);
    setMapping({});
    setPreview([]);
    setDupeCount(0);
    setImportCount(0);
  };

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length < 2) return;

      const hdrs = parsed[0];
      setHeaders(hdrs);
      setRows(parsed.slice(1));

      // Auto-map by header name
      const autoMap: Record<number, MappableField> = {};
      hdrs.forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes("date")) autoMap[i] = "date";
        else if (
          lower.includes("merchant") ||
          lower.includes("description") ||
          lower.includes("payee") ||
          lower.includes("name")
        )
          autoMap[i] = "merchant";
        else if (lower === "amount" || lower.includes("amount"))
          autoMap[i] = "amount";
        else if (lower.includes("debit")) autoMap[i] = "debit";
        else if (lower.includes("credit")) autoMap[i] = "credit";
        else if (lower.includes("category") || lower.includes("type"))
          autoMap[i] = "category";
      });

      setMapping(autoMap);
      setStep("map");
    };

    reader.readAsText(file);
  }, []);

  const handlePreview = () => {
    const dateIdxStr = Object.entries(mapping).find(
      ([, v]) => v === "date"
    )?.[0];
    const merchantIdxStr = Object.entries(mapping).find(
      ([, v]) => v === "merchant"
    )?.[0];
    const amountIdxStr = Object.entries(mapping).find(
      ([, v]) => v === "amount"
    )?.[0];
    const debitIdxStr = Object.entries(mapping).find(
      ([, v]) => v === "debit"
    )?.[0];
    const creditIdxStr = Object.entries(mapping).find(
      ([, v]) => v === "credit"
    )?.[0];
    const catIdxStr = Object.entries(mapping).find(
      ([, v]) => v === "category"
    )?.[0];

    if (!dateIdxStr || !merchantIdxStr || (!amountIdxStr && !debitIdxStr))
      return;

    const dateIdx = Number(dateIdxStr);
    const merchantIdx = Number(merchantIdxStr);
    const amountIdx =
      amountIdxStr !== undefined ? Number(amountIdxStr) : undefined;
    const debitIdx =
      debitIdxStr !== undefined ? Number(debitIdxStr) : undefined;
    const creditIdx =
      creditIdxStr !== undefined ? Number(creditIdxStr) : undefined;
    const catIdx = catIdxStr !== undefined ? Number(catIdxStr) : undefined;

    const items: Array<{
      date: string;
      merchant: string;
      amount: number;
      categoryId: string;
      fp: string;
    }> = [];
    let dupes = 0;

    rows.forEach((row) => {
      // amount parsing
      let amount = 0;
      if (amountIdx !== undefined) {
        amount = cleanNumber(row[amountIdx]);
      } else {
        const debit = cleanNumber(row[debitIdx!]);
        const credit =
          creditIdx !== undefined ? cleanNumber(row[creditIdx]) : 0;
        amount = credit - debit; // income positive, expense negative
      }

      // date parsing: normalize to yyyy-mm-dd when possible
      const rawDate = row[dateIdx] || "";
      let date = rawDate;
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime()))
        date = parsedDate.toISOString().slice(0, 10);

      const merchant = (row[merchantIdx] || "Unknown").trim();
      const categoryId =
        catIdx !== undefined ? (row[catIdx] || "Other").trim() : "Other";

      const fp = fingerprint({ accountId, date, merchant, amount });
      if (existingFPs.has(fp)) {
        dupes++;
        return;
      }

      items.push({ date, merchant, amount, categoryId, fp });
    });

    setPreview(items);
    setDupeCount(dupes);
    setStep("preview");
  };

  const handleImport = () => {
    const importBatchId = crypto.randomUUID?.() ?? String(Date.now());

    let count = 0;
    preview.forEach((p) => {
      // recheck duplicates in case something changed
      if (existingFPs.has(p.fp)) return;

      addTransaction({
        accountId,
        date: p.date,
        merchant: p.merchant,
        amount: p.amount,
        categoryId: p.categoryId || "Other",
        importBatchId,
      });
      count++;
    });

    setImportCount(count);
    setStep("done");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[90vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>
            {step === "upload" && "Import CSV"}
            {step === "map" && "Map Columns"}
            {step === "preview" && "Preview Import"}
            {step === "done" && "Import Complete"}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground mb-4"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.currency})
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-12 cursor-pointer hover:bg-secondary/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Tap to select CSV file
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === "map" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Map each column to a field. Need at least: date, merchant, and
                amount (or debit/credit).
              </p>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-28 truncate">
                      {h}
                    </span>
                    <select
                      value={mapping[i] || "ignore"}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [i]: e.target.value as MappableField,
                        }))
                      }
                      className="flex-1 rounded-lg bg-secondary px-2 py-1.5 text-xs text-foreground"
                    >
                      {MAPPABLE_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep("upload")}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handlePreview}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preview */}
          {step === "preview" && (
            <div>
              {dupeCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-warning/15 px-3 py-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-warning" />
                  <span className="text-xs text-warning">
                    {dupeCount} duplicate(s) will be skipped
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-2">
                {preview.length} transactions to import
              </p>
              <div className="ios-card !p-0 overflow-hidden max-h-60 overflow-y-auto">
                {preview.slice(0, 20).map((p, i) => (
                  <div key={p.fp ?? i} className="ios-list-item">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">
                        {p.merchant}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.date}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold tabular-nums ${
                        p.amount < 0 ? "text-foreground" : "text-success"
                      }`}
                    >
                      {p.amount < 0 ? "−" : "+"}
                      {Math.abs(p.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
                {preview.length > 20 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    ...and {preview.length - 20} more
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setStep("map")}
                  className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
                >
                  Import
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/15">
                <Check className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-medium">
                {importCount} transactions imported
              </p>
              {dupeCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {dupeCount} duplicates skipped
                </p>
              )}
              <button
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
                className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
