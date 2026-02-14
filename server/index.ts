import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import morgan from "morgan";
import { ZodError } from "zod";
import { prisma } from "./db";
import { env } from "./env";
import {
  AccountsPayloadSchema,
  BudgetsPayloadSchema,
  FxRatesPayloadSchema,
  SettingsPayloadSchema,
  TransactionsPayloadSchema,
} from "./types";
import {
  ensureUser,
  readSnapshot,
  replaceAccounts,
  replaceBudgets,
  replaceFxRates,
  replaceSettings,
  replaceTransactions,
} from "./budget-service";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/budget/snapshot", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureUser(prisma, env.APP_USER_ID, env.APP_USER_EMAIL);
    const snapshot = await readSnapshot(prisma, env.APP_USER_ID);
    res.json(snapshot);
  } catch (error) {
    next(error);
  }
});

app.put("/budget/accounts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accounts } = AccountsPayloadSchema.parse(req.body);
    await ensureUser(prisma, env.APP_USER_ID, env.APP_USER_EMAIL);
    await replaceAccounts(prisma, env.APP_USER_ID, accounts);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put("/budget/transactions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactions } = TransactionsPayloadSchema.parse(req.body);
    await ensureUser(prisma, env.APP_USER_ID, env.APP_USER_EMAIL);
    await replaceTransactions(prisma, env.APP_USER_ID, transactions);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put("/budget/budgets", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { budgets } = BudgetsPayloadSchema.parse(req.body);
    await ensureUser(prisma, env.APP_USER_ID, env.APP_USER_EMAIL);
    await replaceBudgets(prisma, env.APP_USER_ID, budgets);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put("/budget/fx-rates", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fxRates } = FxRatesPayloadSchema.parse(req.body);
    await ensureUser(prisma, env.APP_USER_ID, env.APP_USER_EMAIL);
    await replaceFxRates(prisma, env.APP_USER_ID, fxRates);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.put("/budget/settings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { settings } = SettingsPayloadSchema.parse(req.body);
    await ensureUser(prisma, env.APP_USER_ID, env.APP_USER_EMAIL);
    await replaceSettings(prisma, env.APP_USER_ID, settings);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("API error:", error);
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Invalid request body", issues: error.issues });
  }
  if (error instanceof Error) {
    return res.status(500).json({ message: error.message });
  }
  return res.status(500).json({ message: "Unknown server error" });
});

const server = app.listen(env.PORT, () => {
  console.log(`Wallet API listening on http://localhost:${env.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
