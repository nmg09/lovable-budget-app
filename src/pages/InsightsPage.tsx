import { useMemo, useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const CHART_COLORS = [
  "hsl(211, 100%, 50%)",
  "hsl(142, 72%, 42%)",
  "hsl(280, 67%, 55%)",
  "hsl(25, 95%, 53%)",
  "hsl(340, 82%, 52%)",
  "hsl(48, 96%, 53%)",
  "hsl(190, 80%, 45%)",
  "hsl(0, 0%, 55%)",
];

type Period = "week" | "month" | "year" | "ytd" | "all";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getDateRange(period: Period) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  if (period === "all") return { from: null as Date | null, to: today };
  if (period === "week") return { from: new Date(today.getTime() - 6 * 86400000), to: today };
  if (period === "month") return { from: new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)), to: today };
  if (period === "year") return { from: new Date(Date.UTC(today.getFullYear(), 0, 1)), to: today };
  return { from: new Date(Date.UTC(today.getFullYear(), 0, 1)), to: today };
}

function getPreviousRange(period: Period) {
  const current = getDateRange(period);
  if (!current.from) return { from: null as Date | null, to: null as Date | null };
  if (period === "ytd") {
    const now = new Date();
    const startPrev = new Date(Date.UTC(now.getFullYear() - 1, 0, 1));
    const endPrev = new Date(Date.UTC(now.getFullYear() - 1, now.getMonth(), now.getDate()));
    return { from: startPrev, to: endPrev };
  }
  const spanDays = Math.floor((current.to.getTime() - current.from.getTime()) / 86400000) + 1;
  const prevTo = new Date(current.from.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - (spanDays - 1) * 86400000);
  return { from: prevFrom, to: prevTo };
}

export default function InsightsPage() {
  const { transactions, accounts, settings, convert } = useBudget();
  const [period, setPeriod] = useState<Period>("month");

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: settings.homeCurrency, minimumFractionDigits: 0 }).format(n);

  const currentRange = useMemo(() => getDateRange(period), [period]);
  const previousRange = useMemo(() => getPreviousRange(period), [period]);

  const inRange = (dateIso: string, from: Date | null, to: Date | null) => {
    if (!to) return false;
    const day = new Date(`${dateIso}T00:00:00.000Z`);
    if (from && day < from) return false;
    if (day > to) return false;
    return true;
  };

  const txCurrent = useMemo(
    () => transactions.filter((t) => inRange(t.date, currentRange.from, currentRange.to)),
    [transactions, currentRange]
  );

  const txPrevious = useMemo(
    () =>
      !previousRange.to
        ? []
        : transactions.filter((t) => inRange(t.date, previousRange.from, previousRange.to)),
    [transactions, previousRange]
  );

  const totals = useMemo(() => {
    const sum = (list: typeof txCurrent, sign: "income" | "expense") =>
      list
        .filter((t) => (sign === "income" ? t.amount > 0 : t.amount < 0))
        .reduce((acc, t) => {
          const accInfo = accounts.find((a) => a.id === t.accountId);
          const home = convert(Math.abs(t.amount), accInfo?.currency || settings.homeCurrency, settings.homeCurrency);
          return acc + home;
        }, 0);

    const income = sum(txCurrent, "income");
    const expense = sum(txCurrent, "expense");
    const prevExpense = sum(txPrevious, "expense");
    const net = income - expense;
    const expenseChangePct = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : 0;
    return { income, expense, net, prevExpense, expenseChangePct };
  }, [txCurrent, txPrevious, accounts, settings.homeCurrency, convert]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    txCurrent
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const home = convert(Math.abs(t.amount), acc?.currency || settings.homeCurrency, settings.homeCurrency);
        map[t.category] = (map[t.category] || 0) + home;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [txCurrent, accounts, convert, settings.homeCurrency]);

  const totalSpent = byCategory.reduce((s, c) => s + c.value, 0);

  const trend = useMemo(() => {
    const map: Record<string, number> = {};
    txCurrent
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const key = period === "year" || period === "all" ? t.date.slice(0, 7) : t.date;
        const acc = accounts.find((a) => a.id === t.accountId);
        const home = convert(Math.abs(t.amount), acc?.currency || settings.homeCurrency, settings.homeCurrency);
        map[key] = (map[key] || 0) + home;
      });
    return Object.entries(map)
      .map(([key, amount]) => ({ key, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12);
  }, [txCurrent, period, accounts, convert, settings.homeCurrency]);

  const topMerchant = useMemo(() => {
    const map: Record<string, number> = {};
    txCurrent
      .filter((t) => t.amount < 0)
      .forEach((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const home = convert(Math.abs(t.amount), acc?.currency || settings.homeCurrency, settings.homeCurrency);
        map[t.merchant] = (map[t.merchant] || 0) + home;
      });
    const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return top ? { name: top[0], amount: top[1] } : null;
  }, [txCurrent, accounts, convert, settings.homeCurrency]);

  return (
    <div className="px-4 pt-14 pb-24 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Insights</h1>

      <div className="ios-card">
        <p className="ios-section-header !px-0">Time Range</p>
        <div className="grid grid-cols-5 gap-2">
          {(["week", "month", "year", "ytd", "all"] as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-2 py-1.5 text-xs font-medium ${period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-sm font-semibold mt-1">{fmt(totals.income)}</p>
        </div>
        <div className="ios-card">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-sm font-semibold mt-1">{fmt(totals.expense)}</p>
        </div>
        <div className="ios-card">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`text-sm font-semibold mt-1 ${totals.net < 0 ? "text-destructive" : "text-success"}`}>{fmt(totals.net)}</p>
        </div>
        <div className="ios-card">
          <p className="text-xs text-muted-foreground">vs Previous</p>
          <p className={`text-sm font-semibold mt-1 ${totals.expenseChangePct > 0 ? "text-destructive" : "text-success"}`}>
            {totals.prevExpense > 0 ? `${totals.expenseChangePct > 0 ? "+" : ""}${totals.expenseChangePct.toFixed(1)}%` : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="ios-card">
          <p className="text-xs text-muted-foreground">Top Category</p>
          <p className="text-sm font-semibold mt-1">{byCategory[0]?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground mt-1">{byCategory[0] ? fmt(byCategory[0].value) : ""}</p>
        </div>
        <div className="ios-card">
          <p className="text-xs text-muted-foreground">Top Merchant</p>
          <p className="text-sm font-semibold mt-1 truncate">{topMerchant?.name || "N/A"}</p>
          <p className="text-xs text-muted-foreground mt-1">{topMerchant ? fmt(topMerchant.amount) : ""}</p>
        </div>
      </div>

      <div className="ios-card">
        <h2 className="text-sm font-semibold mb-3">Spending by Category</h2>
        {byCategory.length > 0 ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {byCategory.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{Math.round((cat.value / totalSpent) * 100)}%</span>
                    <span className="font-medium tabular-nums">{fmt(cat.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12 text-sm">No spending data for selected range</p>
        )}
      </div>

      <div className="ios-card">
        <h2 className="text-sm font-semibold mb-3">Spending Trend</h2>
        {trend.length > 0 ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <XAxis dataKey="key" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={40} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="amount" fill="hsl(211, 100%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12 text-sm">No data yet</p>
        )}
      </div>
    </div>
  );
}
