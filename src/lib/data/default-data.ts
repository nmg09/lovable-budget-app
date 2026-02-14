import type { Account, AppSettings, Budget, FxRate, Transaction } from "@/types/budget";

export const defaultAccounts: Account[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Main Checking",
    currency: "USD",
    balance: 5240.5,
    color: "hsl(211, 100%, 50%)",
    icon: "card",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Savings",
    currency: "USD",
    balance: 12800,
    color: "hsl(142, 72%, 42%)",
    icon: "bank",
  },
];

export const defaultTransactions: Transaction[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    accountId: "11111111-1111-4111-8111-111111111111",
    date: "2026-02-07",
    merchant: "Whole Foods",
    amount: -87.5,
    category: "Groceries",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    accountId: "11111111-1111-4111-8111-111111111111",
    date: "2026-02-06",
    merchant: "Uber",
    amount: -24.3,
    category: "Transport",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
    accountId: "11111111-1111-4111-8111-111111111111",
    date: "2026-02-05",
    merchant: "Netflix",
    amount: -15.99,
    category: "Entertainment",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4",
    accountId: "11111111-1111-4111-8111-111111111111",
    date: "2026-02-05",
    merchant: "Salary",
    amount: 4500,
    category: "Salary",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5",
    accountId: "11111111-1111-4111-8111-111111111111",
    date: "2026-02-04",
    merchant: "Starbucks",
    amount: -6.45,
    category: "Food & Dining",
  },
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6",
    accountId: "22222222-2222-4222-8222-222222222222",
    date: "2026-02-03",
    merchant: "Interest",
    amount: 12.5,
    category: "Investment",
  },
];

export const defaultBudgets: Budget[] = [
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1", category: "Groceries", limit: 500, month: "2026-02" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2", category: "Food & Dining", limit: 300, month: "2026-02" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3", category: "Transport", limit: 200, month: "2026-02" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4", category: "Entertainment", limit: 100, month: "2026-02" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5", category: "Shopping", limit: 250, month: "2026-02" },
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
