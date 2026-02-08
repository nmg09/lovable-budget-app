import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Currency = "USD" | "AED" | "EUR" | "GBP" | string;

export type Account = {
  id: string;
  name: string;
  currency: Currency;
  icon?: string;
  color?: string;
  startingBalance?: number;
};

export type Category = {
  id: string;
  name: string;
  icon?: string; // emoji like "🍔"
  color?: string; // optional later
};

export type Transaction = {
  id: string;
  accountId: string;
  date: string; // ISO yyyy-mm-dd
  merchant: string;
  amount: number; // in account currency, signed (- expense, + income)
  categoryId: string;
  note?: string;
  importBatchId?: string;
};

export type FXRate = {
  currency: Currency; // to USD
  rateToUSD: number;
};

export type Budget = {
  monthKey: string; // "2026-02"
  categoryId: string;
  limitUSD: number; // budgets are in home currency
};

type AppState = {
  homeCurrency: Currency; // default USD, changeable
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  fxRates: FXRate[];
  budgets: Budget[];

  setHomeCurrency: (c: Currency) => void;

  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;

  upsertFXRate: (currency: Currency, rateToUSD: number) => void;

  setFXRates: (rates: FXRate[]) => void;

  addAccount: (a: Omit<Account, "id"> & { id?: string }) => void;
  deleteAccount: (id: string) => void;

  upsertBudget: (b: Budget) => void;
  deleteBudget: (monthKey: string, categoryId: string) => void;

  addCategory: (c: Omit<Category, "id"> & { id?: string }) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;
};

const uid = () => crypto.randomUUID?.() ?? String(Date.now() + Math.random());

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      homeCurrency: "USD",
      accounts: [
        {
          id: "acc-usd",
          name: "USD Account",
          currency: "USD",
          icon: "💳",
          color: "hsl(211 100% 50%)",
          startingBalance: 0,
        },
        {
          id: "acc-aed",
          name: "AED Account",
          currency: "AED",
          icon: "💳",
          color: "hsl(142 72% 42%)",
          startingBalance: 0,
        },
      ],
      categories: [
        { id: "cat-income", name: "Income", icon: "💰" },
        { id: "cat-food", name: "Food", icon: "🍔" },
        { id: "cat-transport", name: "Transport", icon: "🚗" },
        { id: "cat-bills", name: "Bills", icon: "💡" },
        { id: "cat-other", name: "Other", icon: "📌" },
      ],
      transactions: [],
      fxRates: [
        { currency: "USD", rateToUSD: 1 },
        { currency: "AED", rateToUSD: 0.2723 },
      ],
      budgets: [],

      setHomeCurrency: (c) => set({ homeCurrency: c }),

      addTransaction: (t) =>
        set({ transactions: [{ ...t, id: uid() }, ...get().transactions] }),

      deleteTransaction: (id) =>
        set({ transactions: get().transactions.filter((x) => x.id !== id) }),

      upsertFXRate: (currency, rateToUSD) => {
        const next = [...get().fxRates];
        const idx = next.findIndex((r) => r.currency === currency);
        if (idx >= 0) next[idx] = { currency, rateToUSD };
        else next.push({ currency, rateToUSD });
        set({ fxRates: next });
      },
      setFXRates: (rates) => set({ fxRates: rates }),

      addAccount: (a) => {
        const id = a.id ?? uid();
        set({
          accounts: [
            ...get().accounts,
            {
              id,
              name: a.name,
              currency: a.currency,
              icon: a.icon ?? "💳",
              color: a.color ?? "hsl(211 100% 50%)",
              startingBalance: a.startingBalance ?? 0,
            },
          ],
        });
      },

      deleteAccount: (id) => {
        set({
          accounts: get().accounts.filter((x) => x.id !== id),
          transactions: get().transactions.filter((t) => t.accountId !== id),
        });
      },
      upsertBudget: (b) => {
        const next = get().budgets.filter(
          (x) => !(x.monthKey === b.monthKey && x.categoryId === b.categoryId)
        );
        set({ budgets: [...next, b] });
      },

      deleteBudget: (monthKey, categoryId) => {
        set({
          budgets: get().budgets.filter(
            (x) => !(x.monthKey === monthKey && x.categoryId === categoryId)
          ),
        });
      },

      addCategory: (c) => {
        const id = c.id ?? uid();
        set({
          categories: [
            ...get().categories,
            { id, name: c.name, icon: c.icon ?? "📌", color: c.color },
          ],
        });
      },

      updateCategory: (id, patch) => {
        set({
          categories: get().categories.map((cat) =>
            cat.id === id ? { ...cat, ...patch } : cat
          ),
        });
      },

      deleteCategory: (id) => {
        // When deleting, move any transactions/budgets to "Other"
        const other =
          get().categories.find((c) => c.name === "Other") ??
          get().categories[0];

        set({
          categories: get().categories.filter((c) => c.id !== id),
          transactions: get().transactions.map((t) =>
            t.categoryId === id
              ? { ...t, categoryId: other?.id ?? t.categoryId }
              : t
          ),
          budgets: get().budgets.map((b) =>
            b.categoryId === id
              ? { ...b, categoryId: other?.id ?? b.categoryId }
              : b
          ),
        });
      },
    }),
    { name: "budget-app-store-v1" }
  )
);
