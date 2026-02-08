import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAppStore } from "@/lib/store";

const CATEGORIES = ["Income", "Food", "Transport", "Bills", "Other"];

export default function BudgetsPage() {
  const budgets = useAppStore((s) => s.budgets);
  const upsertBudget = useAppStore((s) => s.upsertBudget);
  const deleteBudget = useAppStore((s) => s.deleteBudget);

  const transactions = useAppStore((s) => s.transactions);
  const accounts = useAppStore((s) => s.accounts);
  const fxRates = useAppStore((s) => s.fxRates);
  const homeCurrency = useAppStore((s) => s.homeCurrency);

  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState(CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState("");

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const rateToUSD = (currency: string) =>
    fxRates.find((r) => r.currency === currency)?.rateToUSD ?? 1;

  const toUSD = (amount: number, fromCurrency: string) =>
    amount * rateToUSD(fromCurrency);

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.monthKey === currentMonth),
    [budgets, currentMonth]
  );

  const spendingUSD = useMemo(() => {
    const result: Record<string, number> = {};
    transactions
      .filter((t) => t.date.startsWith(currentMonth) && t.amount < 0)
      .forEach((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const cur = acc?.currency ?? "USD";
        const usd = toUSD(Math.abs(t.amount), cur);

        // categoryId currently contains the category name in your app
        const cat = t.categoryId || "Other";
        result[cat] = (result[cat] || 0) + usd;
      });
    return result;
  }, [transactions, currentMonth, accounts, fxRates]);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: homeCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const handleAdd = () => {
    const limit = Number(newLimit);
    if (!Number.isFinite(limit) || limit <= 0) return;

    upsertBudget({
      monthKey: currentMonth,
      categoryId: newCat, // using category name for now
      limitUSD: limit,
    });

    setNewLimit("");
    setShowAdd(false);
  };

  return (
    <div className="px-4 pt-14 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Budgets</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>

      {showAdd && (
        <div className="ios-card mb-4 space-y-3 animate-slide-up">
          <select
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
            className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
          >
            {CATEGORIES.filter(
              (c) => !monthBudgets.some((b) => b.categoryId === c)
            ).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
            placeholder="Monthly limit (USD)"
            className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
          />

          <button
            onClick={handleAdd}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Save Budget
          </button>
        </div>
      )}

      <div className="space-y-3">
        {monthBudgets.map((b) => {
          const spent = spendingUSD[b.categoryId] || 0;
          const limit = b.limitUSD;
          const pct = Math.min((spent / limit) * 100, 100);
          const over = spent > limit;

          return (
            <div key={`${b.monthKey}-${b.categoryId}`} className="ios-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">{b.categoryId}</p>
                <button
                  onClick={() => deleteBudget(b.monthKey, b.categoryId)}
                  className="text-muted-foreground"
                  aria-label="Delete budget"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="h-2 rounded-full bg-secondary overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    over ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex justify-between text-xs">
                <span
                  className={
                    over
                      ? "text-destructive font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {fmt(spent)} spent
                </span>
                <span className="text-muted-foreground">
                  {fmt(limit)} limit
                </span>
              </div>
            </div>
          );
        })}

        {monthBudgets.length === 0 && (
          <p className="text-center text-muted-foreground py-20 text-sm">
            No budgets set for this month
          </p>
        )}
      </div>
    </div>
  );
}
