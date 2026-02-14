import type { Account, AppSettings, Budget, FxRate, Transaction } from "@/types/budget";

export const defaultAccounts: Account[] = [
  { id: "1", name: "Main Checking", currency: "USD", balance: 5240.5, color: "hsl(211, 100%, 50%)", icon: "💳" },
  { id: "2", name: "Savings", currency: "USD", balance: 12800, color: "hsl(142, 72%, 42%)", icon: "🏦" },
];

export const defaultTransactions: Transaction[] = [
  { id: "t1", accountId: "1", date: "2026-02-07", merchant: "Whole Foods", amount: -87.5, category: "Groceries" },
  { id: "t2", accountId: "1", date: "2026-02-06", merchant: "Uber", amount: -24.3, category: "Transport" },
  { id: "t3", accountId: "1", date: "2026-02-05", merchant: "Netflix", amount: -15.99, category: "Entertainment" },
  { id: "t4", accountId: "1", date: "2026-02-05", merchant: "Salary", amount: 4500, category: "Salary" },
  { id: "t5", accountId: "1", date: "2026-02-04", merchant: "Starbucks", amount: -6.45, category: "Food & Dining" },
  { id: "t6", accountId: "2", date: "2026-02-03", merchant: "Interest", amount: 12.5, category: "Investment" },
];

export const defaultBudgets: Budget[] = [
  { id: "b1", category: "Groceries", limit: 500, month: "2026-02" },
  { id: "b2", category: "Food & Dining", limit: 300, month: "2026-02" },
  { id: "b3", category: "Transport", limit: 200, month: "2026-02" },
  { id: "b4", category: "Entertainment", limit: 100, month: "2026-02" },
  { id: "b5", category: "Shopping", limit: 250, month: "2026-02" },
];

export const defaultFxRates: FxRate[] = [
  { from: "AED", to: "USD", rate: 0.2723 },
  { from: "EUR", to: "USD", rate: 1.08 },
  { from: "GBP", to: "USD", rate: 1.27 },
  { from: "INR", to: "USD", rate: 0.012 },
  { from: "JPY", to: "USD", rate: 0.0067 },
];

export const defaultSettings: AppSettings = {
  homeCurrency: "USD",
};
