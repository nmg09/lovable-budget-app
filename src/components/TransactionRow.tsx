import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { Transaction } from "@/lib/store";

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  const accounts = useAppStore((s) => s.accounts);
  const categories = useAppStore((s) => s.categories);
  const homeCurrency = useAppStore((s) => s.homeCurrency);

  const account = useMemo(
    () => accounts.find((a) => a.id === transaction.accountId),
    [accounts, transaction.accountId]
  );

  const category = useMemo(
    () => categories.find((c) => c.id === transaction.categoryId),
    [categories, transaction.categoryId]
  );

  const cur = account?.currency || homeCurrency;
  const isExpense = transaction.amount < 0;

  const fmt = (n: number, c: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: c,
      minimumFractionDigits: 2,
    }).format(n);

  const formattedDate = new Date(transaction.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="ios-list-item">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-xl">{category?.icon ?? "📌"}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{transaction.merchant}</p>
          <p className="text-xs text-muted-foreground">
            {formattedDate} · {category?.name ?? "Other"}
          </p>
        </div>
      </div>

      <span
        className={`text-sm font-semibold tabular-nums ${
          isExpense ? "text-foreground" : "text-success"
        }`}
      >
        {isExpense ? "−" : "+"}
        {fmt(Math.abs(transaction.amount), cur)}
      </span>
    </div>
  );
}
