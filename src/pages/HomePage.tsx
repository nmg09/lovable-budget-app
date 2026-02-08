import { useMemo } from "react";
import { TrendingDown, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccountCard } from "@/components/AccountCard";
import { TransactionRow } from "@/components/TransactionRow";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const navigate = useNavigate();

  const accounts = useAppStore((s) => s.accounts);
  const transactions = useAppStore((s) => s.transactions);
  const fxRates = useAppStore((s) => s.fxRates);
  const homeCurrency = useAppStore((s) => s.homeCurrency);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const rateToUSD = (currency: string) =>
    fxRates.find((r) => r.currency === currency)?.rateToUSD ?? 1;

  // MVP: homeCurrency is USD for now. If you later allow homeCurrency != USD,
  // we’ll add a proper cross conversion. For now: convert everything to USD.
  const convertToHome = (amount: number, fromCurrency: string) => {
    if (homeCurrency === "USD") return amount * rateToUSD(fromCurrency);
    // fallback: treat homeCurrency as USD until we add cross-rates
    return amount * rateToUSD(fromCurrency);
  };

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  );

  const monthIncome = useMemo(() => {
    return monthTx
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const currency = acc?.currency ?? homeCurrency;
        return sum + convertToHome(t.amount, currency);
      }, 0);
  }, [monthTx, accounts, homeCurrency, fxRates]);

  const monthExpense = useMemo(() => {
    return monthTx
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const currency = acc?.currency ?? homeCurrency;
        return sum + convertToHome(Math.abs(t.amount), currency);
      }, 0);
  }, [monthTx, accounts, homeCurrency, fxRates]);

  const totalBalance = useMemo(() => {
    // MVP balance = sum of all transactions per account converted to home currency.
    // Later we’ll add startingBalance and show true account balances.
    return accounts.reduce((sum, a) => {
      const accTxSum = transactions
        .filter((t) => t.accountId === a.id)
        .reduce((s, t) => s + t.amount, 0);

      return sum + convertToHome(accTxSum, a.currency);
    }, 0);
  }, [accounts, transactions, homeCurrency, fxRates]);

  const recentTx = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [transactions]
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: homeCurrency === "USD" ? "USD" : "USD",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <div className="px-4 pt-14 pb-24 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Total Balance</p>
        <h1 className="text-4xl font-bold tracking-tight">
          {fmt(totalBalance)}
        </h1>
      </div>

      {/* Income / Expense summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card flex items-center gap-3">
          <div className="rounded-full bg-success/15 p-2">
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-sm font-semibold">{fmt(monthIncome)}</p>
          </div>
        </div>
        <div className="ios-card flex items-center gap-3">
          <div className="rounded-full bg-destructive/15 p-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-sm font-semibold">{fmt(monthExpense)}</p>
          </div>
        </div>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <button
            onClick={() => navigate("/settings")}
            className="text-primary text-sm font-medium"
            aria-label="Manage accounts"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {accounts.map((a) => (
            <AccountCard key={a.id} account={a as any} />
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent</h2>
          <button
            onClick={() => navigate("/transactions")}
            className="text-primary text-sm font-medium"
          >
            See All
          </button>
        </div>
        <div className="ios-card !p-0 overflow-hidden">
          {recentTx.map((tx) => (
            <TransactionRow key={tx.id} transaction={tx as any} />
          ))}
          {recentTx.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No transactions yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
