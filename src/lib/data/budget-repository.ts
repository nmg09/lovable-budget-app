import type { Account, AppSettings, Budget, FxRate, Transaction } from "@/types/budget";

export type BudgetSnapshot = {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  fxRates: FxRate[];
  settings: AppSettings;
};

export interface BudgetRepository {
  loadSnapshot: () => Promise<BudgetSnapshot>;
  saveAccounts: (accounts: Account[]) => Promise<void>;
  saveTransactions: (transactions: Transaction[]) => Promise<void>;
  saveBudgets: (budgets: Budget[]) => Promise<void>;
  saveFxRates: (fxRates: FxRate[]) => Promise<void>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  source: "local" | "remote";
}
