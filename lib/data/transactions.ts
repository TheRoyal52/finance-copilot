// lib/data/transactions.ts
// Server-side data functions for the Transactions page.
// Uses URL search params pattern for filtering.

import { Prisma, CategoryType } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";

// ── Get demo user ID dynamically (same as dashboard.ts) ───────
// IMPORTANT: never hardcode the user ID — the DB auto-generates it.
// The seed creates a user with email "test@financecopilot.dev"
// We find them by email and use their actual DB id.
// In Sprint 2 (Clerk auth), we'll replace with: auth().userId
async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found. Run: npx tsx prisma/seed.ts");
  return user.id;
}

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

// ── Main query: paginated, filtered transactions ───────────
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

  // Build WHERE clause step by step — avoids union type conflicts
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

// ── All categories that have transactions (for filter dropdown) ─
export async function getTransactionCategories() {
  const userId = await getDemoUserId();
  return prisma.category.findMany({
    where: { transactions: { some: { userId } } },
    select: { name: true, type: true },
    orderBy: { name: "asc" },
  });
}

// ── All categories with id (for Add Transaction drawer) ────
export async function getAllCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true, type: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

// ── Summary stats for the page header ─────────────────────
export async function getTransactionSummary() {
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
}
