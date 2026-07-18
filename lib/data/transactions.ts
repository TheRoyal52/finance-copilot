// lib/data/transactions.ts
// Server-side data functions for the Transactions page.
// Uses URL search params pattern for filtering.
//
// CACHING STRATEGY:
// - getTransactionSummary()    → unstable_cache (60s TTL) — changes only when txs change
// - getTransactionCategories() → unstable_cache (60s TTL) — relatively static
// - getAllCategories()          → unstable_cache (300s TTL) — very static (admin-defined)
// - getTransactions()          → NOT cached — uses dynamic search params per request

import { Prisma, CategoryType } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { cache } from "react";

// ── Get demo user ID (deduplicated within one request via React cache) ───
const getDemoUserId = cache(async (): Promise<string> => {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found. Run: npx tsx prisma/seed.ts");
  return user.id;
});

export interface TransactionFilters {
  category?: string;
  type?: string;
  q?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

const ITEMS_PER_PAGE = 20;

// ── Main query: paginated + filtered (NOT cached — depends on search params) ─
export async function getTransactions(filters: TransactionFilters = {}) {
  const {
    category,
    type,
    q,
    page = 1,
    limit = ITEMS_PER_PAGE,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  const userId = await getDemoUserId();
  const skip = (page - 1) * limit;

  const where: Prisma.TransactionWhereInput = { userId };

  if (category) {
    where.category = { name: { equals: category, mode: "insensitive" } };
  }

  if (type && (type === "INCOME" || type === "EXPENSE")) {
    where.category = {
      ...(where.category as Prisma.CategoryWhereInput ?? {}),
      type: { equals: type as CategoryType },
    };
  }

  if (q) {
    where.description = { contains: q, mode: "insensitive" };
  }

  const safeSortBy = (["date", "amount"] as const).includes(sortBy as "date" | "amount")
    ? (sortBy as "date" | "amount")
    : "date";
  const safeOrder = sortOrder === "asc" ? "asc" : "desc";

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: { category: { select: { name: true, type: true } } },
      orderBy: { [safeSortBy]: safeOrder },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    transactions,
    pagination: {
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit,
    },
  };
}

// ── All categories that have transactions (for filter dropdown) ─────────────
// Cached 60s — updates when a new category gets its first transaction
export const getTransactionCategories = unstable_cache(
  async () => {
    const userId = await getDemoUserId();
    return prisma.category.findMany({
      where: { transactions: { some: { userId } } },
      select: { name: true, type: true },
      orderBy: { name: "asc" },
    });
  },
  ["tx-categories"],
  { revalidate: 60, tags: ["transactions-data"] }
);

// ── All categories with id (for Add Transaction drawer) ─────────────────────
// Cached 300s — categories are admin-defined and rarely change
export const getAllCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      select: { id: true, name: true, type: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
  },
  ["all-categories"],
  { revalidate: 300, tags: ["transactions-data"] }
);

// ── Summary stats for the page header ──────────────────────────────────────
// Cached 60s — updates when transactions change
export const getTransactionSummary = unstable_cache(
  async () => {
    const userId = await getDemoUserId();
    const [totalIncome, totalExpenses, count] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    return {
      income: totalIncome._sum.amount ?? 0,
      expenses: Math.abs(totalExpenses._sum.amount ?? 0),
      count,
    };
  },
  ["tx-summary"],
  { revalidate: 60, tags: ["transactions-data", "dashboard-data"] }
);
