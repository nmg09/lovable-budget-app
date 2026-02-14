import { z } from "zod";

export const AccountSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  currency: z.string().length(3),
  balance: z.number(),
  color: z.string().min(1),
  icon: z.string().min(1),
});

export const TransactionSchema = z.object({
  id: z.string().uuid(),
  accountId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().min(1),
  amount: z.number(),
  category: z.string().min(1),
  note: z.string().optional(),
  hash: z.string().optional(),
});

export const BudgetSchema = z.object({
  id: z.string().uuid(),
  category: z.string().min(1),
  limit: z.number().positive(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export const FxRateSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  rate: z.number().positive(),
});

export const AppSettingsSchema = z.object({
  homeCurrency: z.string().length(3),
});

export const AccountsPayloadSchema = z.object({
  accounts: z.array(AccountSchema),
});

export const TransactionsPayloadSchema = z.object({
  transactions: z.array(TransactionSchema),
});

export const BudgetsPayloadSchema = z.object({
  budgets: z.array(BudgetSchema),
});

export const FxRatesPayloadSchema = z.object({
  fxRates: z.array(FxRateSchema),
});

export const SettingsPayloadSchema = z.object({
  settings: AppSettingsSchema,
});

export type AccountDTO = z.infer<typeof AccountSchema>;
export type TransactionDTO = z.infer<typeof TransactionSchema>;
export type BudgetDTO = z.infer<typeof BudgetSchema>;
export type FxRateDTO = z.infer<typeof FxRateSchema>;
export type AppSettingsDTO = z.infer<typeof AppSettingsSchema>;

export type BudgetSnapshotDTO = {
  accounts: AccountDTO[];
  transactions: TransactionDTO[];
  budgets: BudgetDTO[];
  fxRates: FxRateDTO[];
  settings: AppSettingsDTO;
};
