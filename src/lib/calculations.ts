import type { Account, Transaction, AppSettings } from "@/types/budget";

export interface ConversionContext {
  accounts: Account[];
  settings: AppSettings;
  convert: (amount: number, from: string, to: string) => number;
}

/**
 * Calculate total balance across all accounts in home currency
 */
export function calculateTotalBalance(
  accounts: Account[],
  settings: AppSettings,
  convert: (amount: number, from: string, to: string) => number
): number {
  return accounts.reduce(
    (sum, a) => sum + convert(a.balance, a.currency, settings.homeCurrency),
    0
  );
}

/**
 * Calculate total income for a given month
 */
export function calculateMonthIncome(
  transactions: Transaction[],
  currentMonth: string,
  ctx: ConversionContext
): number {
  return transactions
    .filter((t) => t.date.startsWith(currentMonth) && t.amount > 0)
    .reduce((sum, t) => {
      const acc = ctx.accounts.find((a) => a.id === t.accountId);
      return sum + ctx.convert(t.amount, acc?.currency || ctx.settings.homeCurrency, ctx.settings.homeCurrency);
    }, 0);
}

/**
 * Calculate total expenses for a given month
 */
export function calculateMonthExpense(
  transactions: Transaction[],
  currentMonth: string,
  ctx: ConversionContext
): number {
  return transactions
    .filter((t) => t.date.startsWith(currentMonth) && t.amount < 0)
    .reduce((sum, t) => {
      const acc = ctx.accounts.find((a) => a.id === t.accountId);
      return sum + ctx.convert(Math.abs(t.amount), acc?.currency || ctx.settings.homeCurrency, ctx.settings.homeCurrency);
    }, 0);
}

/**
 * Get transactions for a specific month
 */
export function getMonthTransactions(
  transactions: Transaction[],
  currentMonth: string
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(currentMonth));
}

/**
 * Get the most recent transactions
 */
export function getRecentTransactions(
  transactions: Transaction[],
  limit: number = 5
): Transaction[] {
  return [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currencyCode: string
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get spending by category for a given month
 */
export function getSpendingByCategory(
  transactions: Transaction[],
  currentMonth: string,
  ctx: ConversionContext
): Record<string, number> {
  const spending: Record<string, number> = {};

  transactions
    .filter((t) => t.date.startsWith(currentMonth) && t.amount < 0)
    .forEach((t) => {
      const acc = ctx.accounts.find((a) => a.id === t.accountId);
      const convertedAmount = ctx.convert(
        Math.abs(t.amount),
        acc?.currency || ctx.settings.homeCurrency,
        ctx.settings.homeCurrency
      );
      spending[t.category] = (spending[t.category] || 0) + convertedAmount;
    });

  return spending;
}
