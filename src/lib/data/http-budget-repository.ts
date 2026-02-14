import type { Account, AppSettings, Budget, FxRate, Transaction } from "@/types/budget";
import type { BudgetRepository, BudgetSnapshot } from "@/lib/data/budget-repository";

type Method = "GET" | "PUT";

export class HttpBudgetRepository implements BudgetRepository {
  source: "remote" = "remote";
  private readonly baseUrl: string;
  private readonly token?: string;

  constructor(baseUrl: string, token?: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.token = token;
  }

  private async request<T>(method: Method, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API ${method} ${path} failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async loadSnapshot(): Promise<BudgetSnapshot> {
    return this.request<BudgetSnapshot>("GET", "/budget/snapshot");
  }

  async saveAccounts(accounts: Account[]): Promise<void> {
    await this.request<void>("PUT", "/budget/accounts", { accounts });
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    await this.request<void>("PUT", "/budget/transactions", { transactions });
  }

  async saveBudgets(budgets: Budget[]): Promise<void> {
    await this.request<void>("PUT", "/budget/budgets", { budgets });
  }

  async saveFxRates(fxRates: FxRate[]): Promise<void> {
    await this.request<void>("PUT", "/budget/fx-rates", { fxRates });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.request<void>("PUT", "/budget/settings", { settings });
  }
}
