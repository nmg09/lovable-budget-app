import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useAppStore } from "@/lib/store";

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

export default function InsightsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const accounts = useAppStore((s) => s.accounts);
  const fxRates = useAppStore((s) => s.fxRates);
  const homeCurrency = useAppStore((s) => s.homeCurrency);
  const categories = useAppStore((s) => s.categories);
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);

  const rateToUSD = (currency: string) =>
    fxRates.find((r) => r.currency === currency)?.rateToUSD ?? 1;

  const toUSD = (amount: number, fromCurrency: string) =>
    amount * rateToUSD(fromCurrency);

  const monthTx = useMemo(
    () =>
      transactions.filter(
        (t) => t.date.startsWith(currentMonth) && t.amount < 0
      ),
    [transactions, currentMonth]
  );

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};

    monthTx.forEach((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      const cur = acc?.currency ?? "USD";
      const usd = toUSD(Math.abs(t.amount), cur);

      const catId = t.categoryId || "";
      map[catId] = (map[catId] || 0) + usd;
    });

    const other = categories.find((c) => c.name.toLowerCase() === "other");

    return Object.entries(map)
      .map(([catId, value]) => {
        const c = categories.find((x) => x.id === catId);
        return {
          id: catId || (other?.id ?? "other"),
          name: c?.name ?? "Other",
          icon: c?.icon ?? other?.icon ?? "📌",
          value: Math.round(value * 100) / 100,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [monthTx, accounts, fxRates, categories]);

  const dailySpending = useMemo(() => {
    const map: Record<string, number> = {};
    monthTx.forEach((t) => {
      const day = t.date.slice(8);
      const acc = accounts.find((a) => a.id === t.accountId);
      const cur = acc?.currency ?? "USD";
      const usd = toUSD(Math.abs(t.amount), cur);

      map[day] = (map[day] || 0) + usd;
    });

    return Object.entries(map)
      .map(([day, amount]) => ({ day, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [monthTx, accounts, fxRates, categories]);

  const totalSpent = byCategory.reduce((s, c) => s + c.value, 0);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: homeCurrency,
      minimumFractionDigits: 0,
    }).format(n);

  return (
    <div className="px-4 pt-14 pb-24 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Insights</h1>

      {/* Spending by category */}
      <div className="ios-card">
        <h2 className="text-sm font-semibold mb-3">Spending by Category</h2>
        {byCategory.length > 0 ? (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {byCategory.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 mt-2">
              {byCategory.map((cat, i) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                    <span className="inline-flex items-center gap-2">
                      <span className="text-base leading-none">{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {totalSpent > 0
                        ? Math.round((cat.value / totalSpent) * 100)
                        : 0}
                      %
                    </span>
                    <span className="font-medium tabular-nums">
                      {fmt(cat.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12 text-sm">
            No spending data this month
          </p>
        )}
      </div>

      {/* Daily spending */}
      <div className="ios-card">
        <h2 className="text-sm font-semibold mb-3">Daily Spending</h2>
        {dailySpending.length > 0 ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySpending}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="hsl(var(--muted-foreground))"
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(211, 100%, 50%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-12 text-sm">
            No data yet
          </p>
        )}
      </div>
    </div>
  );
}
