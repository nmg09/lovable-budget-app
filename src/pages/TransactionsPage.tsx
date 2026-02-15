import { useEffect, useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { TransactionRow } from "@/components/TransactionRow";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";
import { CsvImportSheet } from "@/components/CsvImportSheet";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIES, type Transaction } from "@/types/budget";
import { Plus, Search, Upload } from "lucide-react";

export default function TransactionsPage() {
  const { transactions, accounts, deleteTransaction, updateTransaction } = useBudget();
  const [showAdd, setShowAdd] = useState(false);
  const [showCsv, setShowCsv] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((tx) => {
        const q = query.trim().toLowerCase();
        if (q && !`${tx.merchant} ${tx.category} ${tx.note || ""}`.toLowerCase().includes(q)) return false;
        if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;
        if (accountFilter !== "all" && tx.accountId !== accountFilter) return false;
        if (typeFilter === "expense" && tx.amount >= 0) return false;
        if (typeFilter === "income" && tx.amount <= 0) return false;
        if (dateFrom && tx.date < dateFrom) return false;
        if (dateTo && tx.date > dateTo) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, query, categoryFilter, accountFilter, typeFilter, dateFrom, dateTo]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return groups;
  }, [filtered]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

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

      <div className="ios-card space-y-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchant, note, category"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg bg-secondary px-2 py-2 text-xs text-foreground"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="rounded-lg bg-secondary px-2 py-2 text-xs text-foreground"
          >
            <option value="all">All accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg bg-secondary px-2 py-2 text-xs text-foreground"
          >
            <option value="all">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategoryFilter("all");
              setAccountFilter("all");
              setTypeFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="rounded-lg bg-secondary px-2 py-2 text-xs text-secondary-foreground"
          >
            Reset filters
          </button>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg bg-secondary px-2 py-2 text-xs text-foreground"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg bg-secondary px-2 py-2 text-xs text-foreground"
          />
        </div>
      </div>

      {Object.entries(grouped).map(([date, txs]) => (
        <div key={date} className="mb-4">
          <p className="ios-section-header">{formatDate(date)}</p>
          <div className="ios-card !p-0 overflow-hidden">
            {txs.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                onEdit={(t) => setEditTx(t)}
                onDelete={deleteTransaction}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-sm">No transactions match your filters</p>
        </div>
      )}

      <AddTransactionSheet open={showAdd} onOpenChange={setShowAdd} />
      <CsvImportSheet open={showCsv} onOpenChange={setShowCsv} />
      <EditTransactionSheet
        transaction={editTx}
        accounts={accounts}
        onOpenChange={(open) => !open && setEditTx(null)}
        onSave={(tx) => {
          updateTransaction(tx);
          setEditTx(null);
        }}
      />
    </div>
  );
}

function EditTransactionSheet({
  transaction,
  accounts,
  onOpenChange,
  onSave,
}: {
  transaction: Transaction | null;
  accounts: Array<{ id: string; name: string; currency: string }>;
  onOpenChange: (open: boolean) => void;
  onSave: (transaction: Transaction) => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [date, setDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isExpense, setIsExpense] = useState(true);

  useEffect(() => {
    if (!transaction) return;
    setMerchant(transaction.merchant);
    setAmount(String(Math.abs(transaction.amount)));
    setCategory(transaction.category);
    setDate(transaction.date);
    setAccountId(transaction.accountId);
    setIsExpense(transaction.amount < 0);
  }, [transaction]);

  return (
    <Sheet open={!!transaction} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Transaction</SheetTitle>
        </SheetHeader>
        {transaction && (
          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsExpense(true)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${isExpense ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setIsExpense(false)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium ${!isExpense ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"}`}
              >
                Income
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Account</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Merchant</label>
              <input
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const parsed = Number(amount);
                if (!merchant || !accountId || !date || Number.isNaN(parsed)) return;
                onSave({
                  ...transaction,
                  merchant,
                  accountId,
                  date,
                  category,
                  amount: isExpense ? -Math.abs(parsed) : Math.abs(parsed),
                });
              }}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Save Changes
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
