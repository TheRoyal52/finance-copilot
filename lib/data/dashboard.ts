// lib/data/dashboard.ts
// ============================================================
// DASHBOARD DATA FETCHING
// ============================================================
//
// WHY A SEPARATE FILE FOR DATA FETCHING?
// Separation of Concerns — one of the most fundamental principles
// in software engineering. Your UI component (how it looks) should
// not be tangled with your data layer (where it gets data from).
//
// If you later switch from Neon to Supabase, or from Prisma to
// Drizzle, you only change THIS file — not every UI component.
//
// HOW NEXT.JS SERVER COMPONENTS WORK:
// In Next.js App Router, components that are NOT marked "use client"
// run ONLY on the server. This means:
//   - They can directly call prisma (no API route needed!)
//   - Database credentials never go to the browser
//   - The HTML is rendered server-side and sent to the browser
//   - Faster initial page load (no loading spinners for initial data)
//
// This file exports functions that page.tsx (a Server Component) calls.
// ============================================================

import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// ── Caching Strategy ──────────────────────────────────────────
// TWO layers of caching:
//
// 1. React cache() — deduplicates within ONE server request
//    If 6 parallel functions all call getDemoUser(), only 1 DB hit.
//    Resets on every new request.
//
// 2. unstable_cache() — persists ACROSS requests (server-side, in-memory)
//    Like Redis but built into Next.js, no extra service needed.
//    TTL: 60 seconds — data refreshes every minute.
//    Tag: "dashboard-data" — revalidatePath() clears these automatically.
//
// INTERVIEW: "How do you avoid 15-20 DB queries per dashboard load?"
// "React.cache() deduplicates within a request — 6 parallel functions
//  that all need the userId only hit Neon once. For cross-request caching,
//  Next.js unstable_cache() acts as a built-in server-side cache with TTL.
//  No Redis required for this scale — saves 15-20 queries per navigation."
//
// WHEN TO USE REDIS instead:
// - Multi-server/serverless (unstable_cache is process-local)
// - Cache sizes > 50MB
// - Need pub/sub or cache invalidation from external events

const getDemoUser = cache(async () => {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
  });
  if (!user) throw new Error("Demo user not found. Run: npx tsx prisma/seed.ts");
  return user;
});

// unstable_cache wraps this: subsequent calls within 60s return cached result
// No Neon round-trip needed until cache expires
export const getBalance = unstable_cache(
  async () => {
    const user = await getDemoUser();
    const result = await prisma.transaction.aggregate({
      where: { userId: user.id },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  },
  ["balance"],
  { revalidate: 60, tags: ["dashboard-data"] }
);

export const getMonthlyCashflow = unstable_cache(
  async () => {
    const user = await getDemoUser();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: sixMonthsAgo } },
      select: { amount: true, date: true },
      orderBy: { date: "asc" },
    });
    const byMonth = transactions.reduce((acc, tx) => {
      const key = tx.date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      if (!acc[key]) acc[key] = { income: 0, expenses: 0 };
      if (tx.amount > 0) acc[key].income += tx.amount;
      else acc[key].expenses += Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);
    return Object.entries(byMonth).slice(-6).map(([month, data]) => ({
      month: month.split(" ")[0],
      ...data,
      net: data.income - data.expenses,
    }));
  },
  ["cashflow"],
  { revalidate: 60, tags: ["dashboard-data"] }
);

export const getCategoryBreakdown = unstable_cache(
  async () => {
    const user = await getDemoUser();
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id, date: { gte: monthStart }, amount: { lt: 0 } },
      include: { category: { select: { name: true } } },
    });
    const byCategory = transactions.reduce((acc, tx) => {
      const name = tx.category?.name ?? "Uncategorized";
      acc[name] = (acc[name] ?? 0) + Math.abs(tx.amount);
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(byCategory).sort(([, a], [, b]) => b - a).slice(0, 6);
    const total  = sorted.reduce((sum, [, amount]) => sum + amount, 0);
    return sorted.map(([name, amount]) => ({
      name, amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
  },
  ["category-breakdown"],
  { revalidate: 60, tags: ["dashboard-data"] }
);


// ── Budget Status (this month) — wrapped in unstable_cache
export const getBudgetStatus = unstable_cache(
  async () => {
    const user = await getDemoUser();
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id, month: { gte: monthStart } },
      include: { category: { select: { name: true } } },
    });

    if (budgets.length === 0) return [];

    const categoryIds = budgets.map((b) => b.categoryId);
    const spendingRows = await prisma.$queryRaw<{ categoryId: string; spent: number }[]>`
      SELECT "categoryId", ABS(SUM("amount")) AS spent
      FROM "Transaction"
      WHERE "userId" = ${user.id}
        AND "categoryId" = ANY(${categoryIds}::text[])
        AND "date" >= ${monthStart}
        AND "date" <= ${monthEnd}
        AND "amount" < 0
      GROUP BY "categoryId"
    `;

    const spendingMap = new Map(spendingRows.map((r) => [r.categoryId, Number(r.spent)]));
    return budgets.map((budget) => {
      const spentAmount = spendingMap.get(budget.categoryId) ?? 0;
      return {
        category: budget.category.name,
        limit: budget.monthlyLimit,
        spent: spentAmount,
        remaining: budget.monthlyLimit - spentAmount,
        percentage: Math.min(Math.round((spentAmount / budget.monthlyLimit) * 100), 100),
        overBudget: spentAmount > budget.monthlyLimit,
      };
    });
  },
  ["budget-status"],
  { revalidate: 60, tags: ["dashboard-data", "budgets-data"] }
);



export const getRecentTransactions = unstable_cache(
  async () => {
    const user = await getDemoUser();
    return prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: { select: { name: true, type: true } } },
      orderBy: { date: "desc" },
      take: 15,
    });
  },
  ["recent-transactions"],
  { revalidate: 30, tags: ["dashboard-data", "transactions-data"] } // 30s — more real-time
);

export const getMonthSummary = unstable_cache(
  async () => {
    const user = await getDemoUser();
    const monthStart = new Date();
    monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: user.id, date: { gte: monthStart }, amount: { gt: 0 } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: user.id, date: { gte: monthStart }, amount: { lt: 0 } },
        _sum: { amount: true },
      }),
    ]);
    const totalIncome   = income._sum.amount ?? 0;
    const totalExpenses = Math.abs(expenses._sum.amount ?? 0);
    return {
      income: totalIncome,
      expenses: totalExpenses,
      net: totalIncome - totalExpenses,
      savingsRate: totalIncome > 0
        ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
        : 0,
    };
  },
  ["month-summary"],
  { revalidate: 60, tags: ["dashboard-data"] }
);
