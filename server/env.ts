import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  APP_USER_ID: z.string().uuid().default("00000000-0000-0000-0000-000000000001"),
  APP_USER_EMAIL: z.string().email().default("demo@walletapp.local"),
  CORS_ORIGIN: z.string().default("http://localhost:8080"),
});

export const env = EnvSchema.parse(process.env);
