import { useState, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBudget } from "@/context/BudgetContext";
import { Upload, Check, AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "map" | "preview" | "done";

const MAPPABLE_FIELDS = ["date", "merchant", "amount", "debit", "credit", "category", "ignore"] as const;
type MappableField = (typeof MAPPABLE_FIELDS)[number];

function parseCsv(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  });
}

function hashRow(row: string[]): string {
  return row.join("|").toLowerCase().replace(/\s+/g, " ");
}

export function CsvImportSheet({ open, onOpenChange }: Props) {
  const { accounts, addTransaction, transactions } = useBudget();
  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<number, MappableField>>({});
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [preview, setPreview] = useState<Array<{ date: string; merchant: string; amount: number }>>([]);
  const [dupeCount, setDupeCount] = useState(0);
  const [importCount, setImportCount] = useState(0);

  useEffect(() => {
    if (!accounts.length) {
      setAccountId("");
      return;
    }
    if (!accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

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
      setHeaders(parsed[0]);
      setRows(parsed.slice(1));
      // Auto-map by header name
      const autoMap: Record<number, MappableField> = {};
      parsed[0].forEach((h, i) => {
        const lower = h.toLowerCase();
        if (lower.includes("date")) autoMap[i] = "date";
        else if (lower.includes("merchant") || lower.includes("description") || lower.includes("payee") || lower.includes("name"))
          autoMap[i] = "merchant";
        else if (lower === "amount" || lower.includes("amount")) autoMap[i] = "amount";
        else if (lower.includes("debit")) autoMap[i] = "debit";
        else if (lower.includes("credit")) autoMap[i] = "credit";
        else if (lower.includes("category") || lower.includes("type")) autoMap[i] = "category";
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  }, []);

  const handlePreview = () => {
    const dateIdx = Object.entries(mapping).find(([, v]) => v === "date")?.[0];
    const merchantIdx = Object.entries(mapping).find(([, v]) => v === "merchant")?.[0];
    const amountIdx = Object.entries(mapping).find(([, v]) => v === "amount")?.[0];
    const debitIdx = Object.entries(mapping).find(([, v]) => v === "debit")?.[0];
    const creditIdx = Object.entries(mapping).find(([, v]) => v === "credit")?.[0];

    if (!dateIdx || !merchantIdx || (!amountIdx && !debitIdx)) return;

    const existingHashes = new Set(transactions.map((t) => t.hash).filter(Boolean));
    const items: Array<{ date: string; merchant: string; amount: number }> = [];
    let dupes = 0;

    rows.forEach((row) => {
      const hash = hashRow(row);
      if (existingHashes.has(hash)) {
        dupes++;
        return;
      }
      let amount = 0;
      if (amountIdx !== undefined) {
        amount = parseFloat(row[Number(amountIdx)]?.replace(/[^0-9.\-]/g, "") || "0");
      } else {
        const debit = parseFloat(row[Number(debitIdx!)]?.replace(/[^0-9.]/g, "") || "0");
        const credit = creditIdx !== undefined ? parseFloat(row[Number(creditIdx)]?.replace(/[^0-9.]/g, "") || "0") : 0;
        amount = credit - debit;
      }

      const rawDate = row[Number(dateIdx)] || "";
      let date = rawDate;
      // Try to parse various date formats
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().slice(0, 10);
      }

      items.push({
        date,
        merchant: row[Number(merchantIdx)] || "Unknown",
        amount,
      });
    });

    setPreview(items);
    setDupeCount(dupes);
    setStep("preview");
  };

  const handleImport = () => {
    if (!accountId || !accounts.some((a) => a.id === accountId)) return;
    const catIdx = Object.entries(mapping).find(([, v]) => v === "category")?.[0];
    const existingHashes = new Set(transactions.map((t) => t.hash).filter(Boolean));

    let count = 0;
    rows.forEach((row, i) => {
      const hash = hashRow(row);
      if (existingHashes.has(hash)) return;
      if (i >= preview.length) return;
      const p = preview[i];
      if (!p) return;

      addTransaction({
        id: crypto.randomUUID(),
        accountId,
        date: p.date,
        merchant: p.merchant,
        amount: p.amount,
        category: catIdx !== undefined ? (row[Number(catIdx)] || "Other") : "Other",
        hash,
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
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
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
                <label className="text-xs text-muted-foreground mb-1 block">Account</label>
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
                <span className="text-sm text-muted-foreground">Tap to select CSV file</span>
                <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
              </label>
            </div>
          )}

          {/* Step 2: Map columns */}
          {step === "map" && (
            <div>
              <p className="text-xs text-muted-foreground mb-3">
                Map each column to a field. Need at least: date, merchant, and amount (or debit/credit).
              </p>
              <div className="space-y-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-28 truncate">{h}</span>
                    <select
                      value={mapping[i] || "ignore"}
                      onChange={(e) =>
                        setMapping((prev) => ({ ...prev, [i]: e.target.value as MappableField }))
                      }
                      className="flex-1 rounded-lg bg-secondary px-2 py-1.5 text-xs text-foreground"
                    >
                      {MAPPABLE_FIELDS.map((f) => (
                        <option key={f} value={f}>{f}</option>
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
                  <span className="text-xs text-warning">{dupeCount} duplicate(s) will be skipped</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mb-2">
                {preview.length} transactions to import
              </p>
              <div className="ios-card !p-0 overflow-hidden max-h-60 overflow-y-auto">
                {preview.slice(0, 20).map((p, i) => (
                  <div key={i} className="ios-list-item">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{p.merchant}</p>
                      <p className="text-[10px] text-muted-foreground">{p.date}</p>
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${p.amount < 0 ? "text-foreground" : "text-success"}`}>
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
              <p className="text-sm font-medium">{importCount} transactions imported</p>
              {dupeCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{dupeCount} duplicates skipped</p>
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
