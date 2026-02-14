import { z } from "zod";

export const AccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  currency: z.string().length(3),
  balance: z.number(),
  color: z.string(),
  icon: z.string(),
});

export const TransactionSchema = z.object({
  id: z.string().min(1),
  accountId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  merchant: z.string().min(1),
  amount: z.number(),
  category: z.string().min(1),
  note: z.string().optional(),
  hash: z.string().optional(),
});

export const BudgetSchema = z.object({
  id: z.string().min(1),
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

export type Account = z.infer<typeof AccountSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type FxRate = z.infer<typeof FxRateSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
