import { useMemo } from "react";
import { useAppStore } from "@/lib/store";

export function AccountCard({ account }: { account: any }) {
  const transactions = useAppStore((s) => s.transactions);
  const fxRates = useAppStore((s) => s.fxRates);
  const homeCurrency = useAppStore((s) => s.homeCurrency);

  const rateToUSD = (currency: string) =>
    fxRates.find((r) => r.currency === currency)?.rateToUSD ?? 1;

  const convertToHome = (amount: number, fromCurrency: string) => {
    // MVP: home currency assumed USD in conversion logic
    if (homeCurrency === "USD") return amount * rateToUSD(fromCurrency);
    return amount * rateToUSD(fromCurrency);
  };

  const balance = useMemo(() => {
    const txSum = transactions
      .filter((t: any) => t.accountId === account.id)
      .reduce((s: number, t: any) => s + t.amount, 0);

    return (account.startingBalance ?? 0) + txSum;
  }, [transactions, account.id, account.startingBalance]);

  const homeBalance = useMemo(
    () => convertToHome(balance, account.currency),
    [balance, account.currency, fxRates]
  );

  const fmt = (n: number, cur: string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 2,
    }).format(n);

  const bg = (account.color ?? "hsl(211 100% 50%)") + "22";

  return (
    <div className="ios-card flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
        style={{ backgroundColor: bg }}
      >
        {account.icon ?? "💳"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{account.name}</p>
        <p className="text-xs text-muted-foreground">{account.currency}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">
          {fmt(balance, account.currency)}
        </p>
        {account.currency !== homeCurrency && (
          <p className="text-xs text-muted-foreground">
            {fmt(homeBalance, homeCurrency)}
          </p>
        )}
      </div>
    </div>
  );
}
