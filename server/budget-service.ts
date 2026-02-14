import { Prisma, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import type { AccountDTO, AppSettingsDTO, BudgetDTO, BudgetSnapshotDTO, FxRateDTO, TransactionDTO } from "./types";

const toNum = (value: unknown) => Number(value);
const toDateISO = (date: Date) => date.toISOString().slice(0, 10);
type AccountRecord = { id: string; name: string; currency: string; balance: unknown; color: string; icon: string };
type TransactionRecord = {
  id: string;
  accountId: string;
  txDate: Date;
  merchant: string;
  amount: unknown;
  category: string;
  note: string | null;
  hash: string | null;
};
type BudgetRecord = { id: string; category: string; limitAmount: unknown; month: string };
type FxRateRecord = { currencyFrom: string; currencyTo: string; rate: unknown };

export async function ensureUser(prisma: PrismaClient, userId: string, email: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email },
    update: { email },
  });
}

export async function readSnapshot(prisma: PrismaClient, userId: string): Promise<BudgetSnapshotDTO> {
  const [accounts, transactions, budgets, fxRates, settings] = await Promise.all([
    prisma.account.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: [{ txDate: "desc" }, { createdAt: "desc" }] }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.fxRate.findMany({ where: { userId } }),
    prisma.appSettings.findUnique({ where: { userId } }),
  ]);

  return {
    accounts: accounts.map((account: AccountRecord) => ({
      id: account.id,
      name: account.name,
      currency: account.currency,
      balance: toNum(account.balance),
      color: account.color,
      icon: account.icon,
    })),
    transactions: transactions.map((tx: TransactionRecord) => ({
      id: tx.id,
      accountId: tx.accountId,
      date: toDateISO(tx.txDate),
      merchant: tx.merchant,
      amount: toNum(tx.amount),
      category: tx.category,
      note: tx.note ?? undefined,
      hash: tx.hash ?? undefined,
    })),
    budgets: budgets.map((budget: BudgetRecord) => ({
      id: budget.id,
      category: budget.category,
      limit: toNum(budget.limitAmount),
      month: budget.month,
    })),
    fxRates: fxRates.map((fxRate: FxRateRecord) => ({
      from: fxRate.currencyFrom,
      to: fxRate.currencyTo,
      rate: toNum(fxRate.rate),
    })),
    settings: {
      homeCurrency: settings?.homeCurrency ?? "USD",
    },
  };
}

export async function replaceAccounts(prisma: PrismaClient, userId: string, accounts: AccountDTO[]): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.transaction.deleteMany({
      where: {
        userId,
        accountId: {
          notIn: accounts.map((a) => a.id),
        },
      },
    });
    await tx.account.deleteMany({ where: { userId } });
    if (!accounts.length) return;
    await tx.account.createMany({
      data: accounts.map((account) => ({
        id: account.id,
        userId,
        name: account.name,
        currency: account.currency,
        balance: account.balance,
        color: account.color,
        icon: account.icon,
      })),
      skipDuplicates: true,
    });
  });
}

export async function replaceTransactions(prisma: PrismaClient, userId: string, transactions: TransactionDTO[]): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.transaction.deleteMany({ where: { userId } });
    if (!transactions.length) return;
    await tx.transaction.createMany({
      data: transactions.map((item) => ({
        id: item.id,
        userId,
        accountId: item.accountId,
        txDate: new Date(`${item.date}T00:00:00.000Z`),
        merchant: item.merchant,
        amount: item.amount,
        category: item.category,
        note: item.note,
        hash: item.hash,
      })),
      skipDuplicates: true,
    });
  });
}

export async function replaceBudgets(prisma: PrismaClient, userId: string, budgets: BudgetDTO[]): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.budget.deleteMany({ where: { userId } });
    if (!budgets.length) return;
    await tx.budget.createMany({
      data: budgets.map((budget) => ({
        id: budget.id,
        userId,
        category: budget.category,
        month: budget.month,
        limitAmount: budget.limit,
      })),
      skipDuplicates: true,
    });
  });
}

export async function replaceFxRates(prisma: PrismaClient, userId: string, fxRates: FxRateDTO[]): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.fxRate.deleteMany({ where: { userId } });
    if (!fxRates.length) return;
    await tx.fxRate.createMany({
      data: fxRates.map((fxRate) => ({
        id: randomUUID(),
        userId,
        currencyFrom: fxRate.from,
        currencyTo: fxRate.to,
        rate: fxRate.rate,
      })),
    });
  });
}

export async function replaceSettings(prisma: PrismaClient, userId: string, settings: AppSettingsDTO): Promise<void> {
  await prisma.appSettings.upsert({
    where: { userId },
    create: {
      userId,
      homeCurrency: settings.homeCurrency,
    },
    update: {
      homeCurrency: settings.homeCurrency,
    },
  });
}
