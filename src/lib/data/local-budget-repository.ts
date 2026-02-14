import type { Account, AppSettings, Budget, FxRate, Transaction } from "@/types/budget";
import type { BudgetRepository, BudgetSnapshot } from "@/lib/data/budget-repository";
import {
  defaultAccounts,
  defaultBudgets,
  defaultFxRates,
  defaultSettings,
  defaultTransactions,
} from "@/lib/data/default-data";

const KEYS = {
  accounts: "budget-accounts",
  transactions: "budget-transactions",
  budgets: "budget-budgets",
  fxRates: "budget-fxrates",
  settings: "budget-settings",
} as const;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export class LocalBudgetRepository implements BudgetRepository {
  source: "local" = "local";

  async loadSnapshot(): Promise<BudgetSnapshot> {
    return {
      accounts: readStorage<Account[]>(KEYS.accounts, defaultAccounts),
      transactions: readStorage<Transaction[]>(KEYS.transactions, defaultTransactions),
      budgets: readStorage<Budget[]>(KEYS.budgets, defaultBudgets),
      fxRates: readStorage<FxRate[]>(KEYS.fxRates, defaultFxRates),
      settings: readStorage<AppSettings>(KEYS.settings, defaultSettings),
    };
  }

  async saveAccounts(accounts: Account[]): Promise<void> {
    writeStorage(KEYS.accounts, accounts);
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    writeStorage(KEYS.transactions, transactions);
  }

  async saveBudgets(budgets: Budget[]): Promise<void> {
    writeStorage(KEYS.budgets, budgets);
  }

  async saveFxRates(fxRates: FxRate[]): Promise<void> {
    writeStorage(KEYS.fxRates, fxRates);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    writeStorage(KEYS.settings, settings);
  }
}
