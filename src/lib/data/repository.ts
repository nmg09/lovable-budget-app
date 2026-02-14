import type { BudgetRepository } from "@/lib/data/budget-repository";
import { HttpBudgetRepository } from "@/lib/data/http-budget-repository";
import { LocalBudgetRepository } from "@/lib/data/local-budget-repository";

export function createBudgetRepository(): BudgetRepository {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const apiToken = import.meta.env.VITE_API_TOKEN;

  if (apiBaseUrl) {
    return new HttpBudgetRepository(apiBaseUrl, apiToken);
  }

  return new LocalBudgetRepository();
}
