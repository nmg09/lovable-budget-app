import { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTransactionSheet({ open, onOpenChange }: Props) {
  const accounts = useAppStore((s) => s.accounts);
  const addTransaction = useAppStore((s) => s.addTransaction);

  const defaultAccountId = useMemo(() => accounts[0]?.id ?? "", [accounts]);

  const [accountId, setAccountId] = useState(defaultAccountId);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isExpense, setIsExpense] = useState(true);
  const categories = useAppStore((s) => s.categories);

  // If accounts load/change, ensure we always have a valid selected account
  useEffect(() => {
    if (!accountId && defaultAccountId) setAccountId(defaultAccountId);
  }, [accountId, defaultAccountId]);

  // ensure valid category
  useEffect(() => {
    if (!categoryId && categories.length) {
      const other = categories.find((c) => c.name === "Other") ?? categories[0];
      setCategoryId(other.id);
    }
  }, [categoryId, categories]);

  const handleSubmit = () => {
    if (!merchant || !amount || !accountId) return;
    const num = Number(amount);
    if (!Number.isFinite(num)) return;

    addTransaction({
      accountId,
      date,
      merchant: merchant.trim(),
      amount: isExpense ? -Math.abs(num) : Math.abs(num),
      // keep as string for now to match your existing app
      categoryId,
      note: undefined,
      importBatchId: undefined,
    });

    setMerchant("");
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Add Transaction</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsExpense(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                isExpense
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setIsExpense(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                !isExpense
                  ? "bg-success/15 text-success"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              Income
            </button>
          </div>

          {/* Account */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Account
            </label>
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

          {/* Merchant */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Merchant
            </label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks"
              className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon ?? "📌"} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Add Transaction
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
