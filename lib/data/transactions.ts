// lib/data/transactions.ts
// Server-side data functions for the Transactions page.
// Uses URL search params pattern for filtering.

import { Prisma, CategoryType } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";

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

  const skip = (page - 1) * limit;

  // Build Prisma WHERE clause step by step — avoids union type conflicts
  // Prisma's TypeScript types are strict about how relation filters combine,
  // so we build the object imperatively instead of with spread operators.
  const where: Prisma.TransactionWhereInput = {
    userId: "demo-user-001",
  };

  // Category name filter (on the related Category model)
  if (category) {
    where.category = {
      name: { equals: category, mode: "insensitive" },
    };
  }

  // Category type filter (INCOME / EXPENSE)
  // CategoryType is a Prisma enum — must cast from string URL param
  // URL params are always strings, Prisma expects the enum value
  if (type && (type === "INCOME" || type === "EXPENSE")) {
    where.category = {
      ...(where.category as Prisma.CategoryWhereInput ?? {}),
      type: { equals: type as CategoryType },
    };
  }

  // Full-text description search
  if (q) {
    where.description = { contains: q, mode: "insensitive" };
  }

  // Build sort — only allow safe column names to prevent injection
  const safeSortBy = (["date", "amount"] as const).includes(
    sortBy as "date" | "amount"
  )
    ? (sortBy as "date" | "amount")
    : "date";

  const safeOrder = sortOrder === "asc" ? "asc" : "desc";

  // Run count + data in parallel
  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      include: {
        category: { select: { name: true, type: true } },
      },
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

// ── All categories that have transactions ──────────────────
export async function getTransactionCategories() {
  return prisma.category.findMany({
    where: {
      transactions: { some: { userId: "demo-user-001" } },
    },
    select: { name: true, type: true },
    orderBy: { name: "asc" },
  });
}

// ── Summary stats for the page header ─────────────────────
export async function getTransactionSummary() {
  const [totalIncome, totalExpenses, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId: "demo-user-001", amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: "demo-user-001", amount: { lt: 0 } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: { userId: "demo-user-001" } }),
  ]);

  return {
    income: totalIncome._sum.amount ?? 0,
    expenses: Math.abs(totalExpenses._sum.amount ?? 0),
    count: transactionCount,
  };
}
