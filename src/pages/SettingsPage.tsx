import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronRight, Pencil, Check, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";

const CURRENCIES = ["USD", "AED", "EUR", "GBP"];

export default function SettingsPage() {
  const homeCurrency = useAppStore((s) => s.homeCurrency);
  const setHomeCurrency = useAppStore((s) => s.setHomeCurrency);

  const accounts = useAppStore((s) => s.accounts);
  const addAccount = useAppStore((s) => s.addAccount);
  const deleteAccount = useAppStore((s) => s.deleteAccount);

  const fxRates = useAppStore((s) => s.fxRates);
  const setFXRates = useAppStore((s) => s.setFXRates);

  const categories = useAppStore((s) => s.categories);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showFxRates, setShowFxRates] = useState(false);

  const [accName, setAccName] = useState("");
  const [accCurrency, setAccCurrency] = useState("USD");

  // Categories UI state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("📌");

  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = useMemo(
    () => categories.find((c) => c.id === editingId) ?? null,
    [categories, editingId]
  );
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("📌");

  const handleAddAccount = () => {
    if (!accName.trim()) return;
    addAccount({ name: accName.trim(), currency: accCurrency });
    setAccName("");
    setShowAddAccount(false);
  };

  const handleFxChange = (index: number, rate: string) => {
    const num = Number(rate);
    if (!Number.isFinite(num)) return;
    setFXRates(
      fxRates.map((r, i) => (i === index ? { ...r, rateToUSD: num } : r))
    );
  };

  const addFxRate = () => {
    const defaultCur = CURRENCIES.find((c) => c !== "USD") ?? "EUR";
    setFXRates([...fxRates, { currency: defaultCur, rateToUSD: 1 }]);
  };

  const openEdit = (id: string) => {
    const c = categories.find((x) => x.id === id);
    if (!c) return;
    setEditingId(id);
    setEditName(c.name);
    setEditIcon(c.icon ?? "📌");
  };

  const saveEdit = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    updateCategory(editingId, { name, icon: editIcon || "📌" });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleAddCategory = () => {
    const name = catName.trim();
    if (!name) return;
    addCategory({ name, icon: catIcon || "📌" });
    setCatName("");
    setCatIcon("📌");
    setShowAddCategory(false);
  };

  const isOther = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c?.name.toLowerCase() === "other";
  };

  return (
    <div className="px-4 pt-14 pb-24 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Home Currency */}
      <div className="ios-card">
        <p className="ios-section-header !px-0">Home Currency</p>
        <select
          value={homeCurrency}
          onChange={(e) => setHomeCurrency(e.target.value)}
          className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Accounts */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="ios-section-header !px-0">Accounts</p>
          <button
            onClick={() => setShowAddAccount(true)}
            className="text-primary"
            aria-label="Add account"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="ios-card !p-0 overflow-hidden">
          {accounts.map((a) => (
            <div key={a.id} className="ios-list-item">
              <div className="flex items-center gap-3">
                <span className="text-lg">{a.icon ?? "💳"}</span>
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.currency}</p>
                </div>
              </div>
              <button
                onClick={() => deleteAccount(a.id)}
                className="text-destructive"
                aria-label="Delete account"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {accounts.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No accounts
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="ios-section-header !px-0">Categories</p>
          <button
            onClick={() => setShowAddCategory(true)}
            className="text-primary"
            aria-label="Add category"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="ios-card !p-0 overflow-hidden">
          {categories.map((c) => (
            <div key={c.id} className="ios-list-item">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{c.icon ?? "📌"}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEdit(c.id)}
                  className="text-muted-foreground"
                  aria-label="Edit category"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => !isOther(c.id) && deleteCategory(c.id)}
                  className={
                    isOther(c.id)
                      ? "text-muted-foreground/40"
                      : "text-destructive"
                  }
                  aria-label="Delete category"
                  disabled={isOther(c.id)}
                  title={isOther(c.id) ? "Cannot delete Other" : "Delete"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">
              No categories
            </p>
          )}
        </div>

        {/* Edit category (inline card) */}
        {editing && (
          <div className="ios-card mt-3 space-y-3 animate-slide-up">
            <p className="text-sm font-semibold">Edit Category</p>

            <div className="flex gap-2">
              <input
                value={editIcon}
                onChange={(e) => setEditIcon(e.target.value)}
                className="w-16 rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground text-center"
                placeholder="📌"
              />
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
                placeholder="Name"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="flex-1 rounded-xl bg-secondary py-2.5 text-sm font-medium text-secondary-foreground"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <X className="h-4 w-4" /> Cancel
                </span>
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  <Check className="h-4 w-4" /> Save
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FX Rates */}
      <div>
        <button
          onClick={() => setShowFxRates(!showFxRates)}
          className="flex items-center justify-between w-full ios-card"
        >
          <span className="text-sm font-medium">Exchange Rates</span>
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transition-transform ${
              showFxRates ? "rotate-90" : ""
            }`}
          />
        </button>

        {showFxRates && (
          <div className="mt-2 space-y-2 animate-slide-up">
            {fxRates.map((r, i) => (
              <div
                key={`${r.currency}-${i}`}
                className="ios-card flex items-center gap-2"
              >
                <select
                  value={r.currency}
                  onChange={(e) =>
                    setFXRates(
                      fxRates.map((x, j) =>
                        j === i ? { ...x, currency: e.target.value } : x
                      )
                    )
                  }
                  className="rounded-lg bg-secondary px-2 py-1.5 text-xs text-foreground w-20"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs font-medium">USD</span>

                <input
                  type="number"
                  step="0.0001"
                  value={r.rateToUSD}
                  onChange={(e) => handleFxChange(i, e.target.value)}
                  className="flex-1 rounded-lg bg-secondary px-2 py-1.5 text-xs text-foreground text-right"
                />

                <button
                  onClick={() => setFXRates(fxRates.filter((_, j) => j !== i))}
                  className="text-destructive"
                  aria-label="Remove FX rate"
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
              <label className="text-xs text-muted-foreground mb-1 block">
                Name
              </label>
              <input
                value={accName}
                onChange={(e) => setAccName(e.target.value)}
                placeholder="e.g. Main Checking"
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Currency
              </label>
              <select
                value={accCurrency}
                onChange={(e) => setAccCurrency(e.target.value)}
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
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

      {/* Add category sheet */}
      <Sheet open={showAddCategory} onOpenChange={setShowAddCategory}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Add Category</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Icon (emoji)
              </label>
              <input
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                placeholder="📌"
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Tip: open your emoji keyboard and paste one emoji.
              </p>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Name
              </label>
              <input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Coffee"
                className="w-full rounded-lg bg-secondary px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              onClick={handleAddCategory}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Add Category
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
