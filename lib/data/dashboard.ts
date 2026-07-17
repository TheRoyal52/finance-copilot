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

// React cache() deduplicates this call within one server request.
// Without it: 6 parallel Promise.all functions → 6 SELECT queries to Neon.
// With cache(): first call fetches, all others return the same promise.
// This is the Next.js recommended pattern for shared server data.
// Docs: https://react.dev/reference/react/cache
const getDemoUser = cache(async () => {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
  });
  if (!user) throw new Error("Demo user not found. Run: npx tsx prisma/seed.ts");
  return user;
});

// ── Current Balance ───────────────────────────────────────────
// Sum ALL transactions: income (positive) - expenses (negative)
// In Prisma: aggregate() performs a SQL SUM function
//
// SQL equivalent: SELECT SUM(amount) FROM "Transaction" WHERE userId = ?
export async function getBalance() {
  const user = await getDemoUser();
  
  const result = await prisma.transaction.aggregate({
    where: { userId: user.id },
    _sum: { amount: true },
  });
  
  return result._sum.amount ?? 0;
}

// ── Monthly Cash Flow (last 6 months) ────────────────────────
// Returns an array of { month: "Jun", income: 75000, expenses: 15000 }
// Used by the line chart on the dashboard
export async function getMonthlyCashflow() {
  const user = await getDemoUser();
  
  // Get transactions from the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: sixMonthsAgo },
    },
    select: {
      amount: true,
      date: true,
    },
    orderBy: { date: "asc" },
  });
  
  // Group transactions by month
  // reduce() walks through the array and builds a new object
  const byMonth = transactions.reduce((acc, tx) => {
    // "Jun 2025", "Jul 2025" etc
    const key = tx.date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
    
    if (!acc[key]) {
      acc[key] = { income: 0, expenses: 0 };
    }
    
    if (tx.amount > 0) {
      acc[key].income += tx.amount;
    } else {
      acc[key].expenses += Math.abs(tx.amount); // make positive for display
    }
    
    return acc;
  }, {} as Record<string, { income: number; expenses: number }>);
  
  // Convert to array and take last 6 months
  return Object.entries(byMonth)
    .slice(-6)
    .map(([month, data]) => ({
      month: month.split(" ")[0], // just "Jun", "Jul" etc
      ...data,
      net: data.income - data.expenses,
    }));
}

// ── Category Spending Breakdown (this month) ─────────────────
// Returns spending per category for horizontal bar chart
// Sorted by amount, top 6 categories only
export async function getCategoryBreakdown() {
  const user = await getDemoUser();
  
  // First day of current month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  // Fetch all expense transactions this month WITH their category
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      date: { gte: monthStart },
      amount: { lt: 0 }, // expenses only (negative amounts)
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  });
  
  // Group by category and sum
  const byCategory = transactions.reduce((acc, tx) => {
    const name = tx.category?.name ?? "Uncategorized";
    acc[name] = (acc[name] ?? 0) + Math.abs(tx.amount);
    return acc;
  }, {} as Record<string, number>);
  
  // Sort by amount, take top 6
  const sorted = Object.entries(byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  
  // Calculate total for percentage calculation
  const total = sorted.reduce((sum, [, amount]) => sum + amount, 0);
  
  return sorted.map(([name, amount]) => ({
    name,
    amount,
    percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
  }));
}

// ── Budget Status (this month) ─────────────────────────────── 
// How much of each budget has been used — used by CategoryBars on dashboard
export async function getBudgetStatus() {
  const user = await getDemoUser();
  
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const budgets = await prisma.budget.findMany({
    where: {
      userId: user.id,
      month: { gte: monthStart },
    },
    include: {
      category: { select: { name: true } },
    },
  });

  if (budgets.length === 0) return [];

  // N+1 FIX: single GROUP BY instead of one aggregate per budget
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
      percentage: Math.min(
        Math.round((spentAmount / budget.monthlyLimit) * 100),
        100
      ),
      overBudget: spentAmount > budget.monthlyLimit,
    };
  });
}

// ── Recent Transactions ───────────────────────────────────────
// Last 15 transactions with category info
export async function getRecentTransactions() {
  const user = await getDemoUser();
  
  return prisma.transaction.findMany({
    where: { userId: user.id },
    include: {
      category: {
        select: { name: true, type: true },
      },
    },
    orderBy: { date: "desc" },
    take: 15,  // only last 15 — the table shows this many
  });
}

// ── This month's summary numbers ─────────────────────────────
export async function getMonthSummary() {
  const user = await getDemoUser();
  
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  
  const [income, expenses] = await Promise.all([
    // Total income this month (positive amounts)
    prisma.transaction.aggregate({
      where: { userId: user.id, date: { gte: monthStart }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    // Total expenses this month (negative amounts)
    prisma.transaction.aggregate({
      where: { userId: user.id, date: { gte: monthStart }, amount: { lt: 0 } },
      _sum: { amount: true },
    }),
  ]);
  
  const totalIncome = income._sum.amount ?? 0;
  const totalExpenses = Math.abs(expenses._sum.amount ?? 0);
  
  return {
    income: totalIncome,
    expenses: totalExpenses,
    net: totalIncome - totalExpenses,
    savingsRate: totalIncome > 0
      ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100)
      : 0,
  };
}
