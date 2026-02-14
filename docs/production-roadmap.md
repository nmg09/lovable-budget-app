# Wallet App Production Roadmap

## What Is Already Done
- A repository abstraction now exists in `src/lib/data`.
- `BudgetContext` reads/writes through that abstraction.
- Default mode is local data, and remote mode is enabled automatically when `VITE_API_BASE_URL` is set.

## Recommended Architecture
- Frontend: existing React/Vite app.
- Backend API: Node.js (Fastify/Express) or Supabase Edge functions.
- Database: PostgreSQL.
- Auth: Supabase Auth or Clerk (email/password + social login later).

## Minimum Database Tables

```sql
create table users (
  id uuid primary key,
  email text unique not null,
  created_at timestamptz not null default now()
);

create table accounts (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  currency char(3) not null,
  balance numeric(14,2) not null default 0,
  color text not null,
  icon text not null,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  tx_date date not null,
  merchant text not null,
  amount numeric(14,2) not null,
  category text not null,
  note text,
  hash text,
  created_at timestamptz not null default now()
);
create index transactions_user_date_idx on transactions(user_id, tx_date desc);
create unique index transactions_user_hash_uq on transactions(user_id, hash) where hash is not null;

create table budgets (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  category text not null,
  month char(7) not null,
  limit_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  unique(user_id, category, month)
);

create table fx_rates (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  currency_from char(3) not null,
  currency_to char(3) not null,
  rate numeric(18,8) not null,
  updated_at timestamptz not null default now(),
  unique(user_id, currency_from, currency_to)
);

create table app_settings (
  user_id uuid primary key references users(id) on delete cascade,
  home_currency char(3) not null
);
```

## API Contract This Frontend Expects
- `GET /budget/snapshot` -> `{ accounts, transactions, budgets, fxRates, settings }`
- `PUT /budget/accounts` -> `{ accounts }`
- `PUT /budget/transactions` -> `{ transactions }`
- `PUT /budget/budgets` -> `{ budgets }`
- `PUT /budget/fx-rates` -> `{ fxRates }`
- `PUT /budget/settings` -> `{ settings }`

## Next Steps
1. Run the backend scaffold in this repo:
   - `npm install`
   - copy `.env.example` to `.env`
   - `npm run prisma:generate`
   - `npm run prisma:push`
   - `npm run dev:server`
2. Start frontend with API:
   - `npm run dev`
3. Add auth and enforce per-user row security.
4. Replace full-list `PUT` writes with granular CRUD endpoints.
5. Add tests for transaction import, dedup, and account balance consistency.
