import { useState } from "react";
import { useBudget } from "@/context/BudgetContext";
import { CURRENCIES, ACCOUNT_COLORS } from "@/types/budget";
import { Plus, Trash2, ChevronRight, RefreshCw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function SettingsPage() {
  const { settings, setSettings, accounts, addAccount, deleteAccount, fxRates, setFxRates, dataSource, syncError, reloadData } = useBudget();
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showFxRates, setShowFxRates] = useState(false);
  const [accName, setAccName] = useState("");
  const [accCurrency, setAccCurrency] = useState("USD");

  const handleAddAccount = () => {
    if (!accName) return;
    addAccount({
      id: crypto.randomUUID(),
      name: accName,
      currency: accCurrency,
      balance: 0,
      color: ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
      icon: "💳",
    });
    setAccName("");
    setShowAddAccount(false);
  };

  const handleFxChange = (index: number, rate: string) => {
    const num = parseFloat(rate);
    if (isNaN(num)) return;
    setFxRates((prev) => prev.map((r, i) => (i === index ? { ...r, rate: num } : r)));
  };

  const addFxRate = () => {
    setFxRates((prev) => [...prev, { from: "EUR", to: settings.homeCurrency, rate: 1 }]);
  };

  return (
    <div className="px-4 pt-14 pb-24 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="ios-card">
        <p className="ios-section-header !px-0">Data Sync</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Source: <span className="font-medium text-foreground">{dataSource === "remote" ? "Remote API" : "Local device"}</span>
          </p>
          <button
            onClick={() => void reloadData()}
            className="rounded-lg bg-secondary p-2 text-secondary-foreground"
            aria-label="Reload data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {syncError && <p className="mt-2 text-xs text-destructive">{syncError}</p>}
      </div>

      {/* Home Currency */}
      <div className="ios-card">
        <p className="ios-section-header !px-0">Home Currency</p>
        <select
          value={settings.homeCurrency}
          onChange={(e) => setSettings((s) => ({ ...s, homeCurrency: e.target.value }))}
          className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="ios-section-header !px-0">Accounts</p>
          <button onClick={() => setShowAddAccount(true)} className="text-primary">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="ios-card !p-0 overflow-hidden">
          {accounts.map((a) => (
            <div key={a.id} className="ios-list-item">
              <div className="flex items-center gap-3">
                <span className="text-lg">{a.icon}</span>
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.currency}</p>
                </div>
              </div>
              <button onClick={() => deleteAccount(a.id)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {accounts.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">No accounts</p>
          )}
        </div>
      </div>

      {/* FX Rates */}
      <div>
        <button
          onClick={() => setShowFxRates(!showFxRates)}
          className="flex items-center justify-between w-full ios-card"
        >
          <span className="text-sm font-medium">Exchange Rates</span>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showFxRates ? "rotate-90" : ""}`} />
        </button>
        {showFxRates && (
          <div className="mt-2 space-y-2 animate-slide-up">
            {fxRates.map((r, i) => (
              <div key={i} className="ios-card flex items-center gap-2">
                <select
                  value={r.from}
                  onChange={(e) =>
                    setFxRates((prev) => prev.map((x, j) => (j === i ? { ...x, from: e.target.value } : x)))
                  }
                  className="rounded-lg bg-secondary px-2 py-1.5 text-xs text-foreground w-20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs font-medium">{settings.homeCurrency}</span>
                <input
                  type="number"
                  step="0.0001"
                  value={r.rate}
                  onChange={(e) => handleFxChange(i, e.target.value)}
                  className="flex-1 rounded-lg bg-secondary px-2 py-1.5 text-xs text-foreground text-right"
                />
                <button
                  onClick={() => setFxRates((prev) => prev.filter((_, j) => j !== i))}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              onClick={addFxRate}
              className="w-full rounded-xl bg-secondary py-2 text-xs font-medium text-secondary-foreground"
            >
              + Add Rate
            </button>
          </div>
        )}
      </div>

      {/* Add account sheet */}
      <Sheet open={showAddAccount} onOpenChange={setShowAddAccount}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Add Account</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. Main Checking"
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <select
                value={accCurrency}
                onChange={(e) => setAccCurrency(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddAccount}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Add Account
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
