import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Account, AppSettings, Budget, FxRate, Transaction } from "@/types/budget";
import { createBudgetRepository } from "@/lib/data/repository";
import {
  defaultAccounts,
  defaultBudgets,
  defaultFxRates,
  defaultSettings,
  defaultTransactions,
} from "@/lib/data/default-data";

interface BudgetContextType {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  fxRates: FxRate[];
  setFxRates: React.Dispatch<React.SetStateAction<FxRate[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  convert: (amount: number, from: string, to: string) => number;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  currentMonth: string;
  isHydrated: boolean;
  syncError: string | null;
  dataSource: "local" | "remote";
  reloadData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const repositoryRef = useRef(createBudgetRepository());
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const repository = repositoryRef.current;

  const [accounts, setAccounts] = useState<Account[]>(defaultAccounts);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(defaultBudgets);
  const [fxRates, setFxRates] = useState<FxRate[]>(defaultFxRates);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const currentMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const reloadData = useCallback(async () => {
    try {
      const snapshot = await repository.loadSnapshot();
      setAccounts(snapshot.accounts);
      setTransactions(snapshot.transactions);
      setBudgets(snapshot.budgets);
      setFxRates(snapshot.fxRates);
      setSettings(snapshot.settings);
      setSyncError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load budget data.";
      setSyncError(message);
    } finally {
      setIsHydrated(true);
    }
  }, [repository]);

  useEffect(() => {
    void reloadData();
  }, [reloadData]);

  useEffect(() => {
    if (!isHydrated) return;

    const accountsSnapshot = [...accounts];
    const budgetsSnapshot = [...budgets];
    const fxRatesSnapshot = [...fxRates];
    const settingsSnapshot = settings;
    const validAccountIds = new Set(accountsSnapshot.map((a) => a.id));
    const transactionsSnapshot = transactions.filter((t) => validAccountIds.has(t.accountId));

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        await repository.saveAccounts(accountsSnapshot);
        await repository.saveTransactions(transactionsSnapshot);
        await repository.saveBudgets(budgetsSnapshot);
        await repository.saveFxRates(fxRatesSnapshot);
        await repository.saveSettings(settingsSnapshot);
        setSyncError(null);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to sync data.";
        setSyncError(message);
      });
  }, [accounts, budgets, fxRates, settings, transactions, isHydrated, repository]);

  const convert = useCallback(
    (amount: number, from: string, to: string): number => {
      if (from === to) return amount;
      const direct = fxRates.find((r) => r.from === from && r.to === to);
      if (direct) return amount * direct.rate;
      const reverse = fxRates.find((r) => r.from === to && r.to === from);
      if (reverse) return amount / reverse.rate;
      return amount;
    },
    [fxRates]
  );

  const addTransaction = useCallback(
    (tx: Transaction) => {
      setTransactions((prev) => [tx, ...prev]);
      setAccounts((prev) => prev.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance + tx.amount } : a)));
    },
    [setTransactions, setAccounts]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => {
        const tx = prev.find((t) => t.id === id);
        if (tx) {
          setAccounts((accs) => accs.map((a) => (a.id === tx.accountId ? { ...a, balance: a.balance - tx.amount } : a)));
        }
        return prev.filter((t) => t.id !== id);
      });
    },
    [setTransactions, setAccounts]
  );

  const updateTransaction = useCallback(
    (updated: Transaction) => {
      setTransactions((prev) => {
        const existing = prev.find((t) => t.id === updated.id);
        if (!existing) return prev;

        setAccounts((accs) => {
          let next = accs;
          // Reverse old impact.
          next = next.map((a) =>
            a.id === existing.accountId ? { ...a, balance: a.balance - existing.amount } : a
          );
          // Apply new impact.
          next = next.map((a) =>
            a.id === updated.accountId ? { ...a, balance: a.balance + updated.amount } : a
          );
          return next;
        });

        return prev.map((t) => (t.id === updated.id ? updated : t));
      });
    },
    [setTransactions, setAccounts]
  );

  const addAccount = useCallback(
    (account: Account) => setAccounts((prev) => [...prev, account]),
    [setAccounts]
  );

  const deleteAccount = useCallback(
    (id: string) => {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      setTransactions((prev) => prev.filter((t) => t.accountId !== id));
    },
    [setAccounts, setTransactions]
  );

  return (
    <BudgetContext.Provider
      value={{
        accounts,
        setAccounts,
        transactions,
        setTransactions,
        budgets,
        setBudgets,
        fxRates,
        setFxRates,
        settings,
        setSettings,
        convert,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        deleteAccount,
        currentMonth,
        isHydrated,
        syncError,
        dataSource: repository.source,
        reloadData,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
}
