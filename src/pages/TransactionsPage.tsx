import { useMemo, useState } from "react";
import { TransactionRow } from "@/components/TransactionRow";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { CsvImportSheet } from "@/components/CsvImportSheet";
import { Plus, Upload } from "lucide-react";
import { useAppStore } from "../lib/store";

export default function TransactionsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const categories = useAppStore((s) => s.categories);
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);

  const grouped = useMemo(() => {
    const sorted = [...transactions].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    const groups: Record<string, typeof transactions> = {};
    sorted.forEach((tx) => {
      const key = tx.date;
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return groups;
  }, [transactions]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

  return (
    <div className="px-4 pt-14 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsv(true)}
            className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
          >
            <Upload className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </div>

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="mb-4">
          <p className="ios-section-header">{formatDate(date)}</p>
          <div className="ios-card !p-0 overflow-hidden">
            {txs.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} />
            ))}
          </div>
        </div>
      ))}

      {transactions.length === 0 && (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-sm">No transactions yet</p>
          <p className="text-xs mt-1">Add one or import a CSV</p>
        </div>
      )}

      <AddTransactionSheet open={showAdd} onOpenChange={setShowAdd} />
      <CsvImportSheet open={showCsv} onOpenChange={setShowCsv} />
    </div>
  );
}
