// lib/data/budgets.ts
// ============================================================
// BUDGETS DATA LAYER
// ============================================================
//
// WHAT IS A BUDGET IN OUR SCHEMA?
// Budget = { userId, categoryId, monthlyLimit, month (YYYY-MM) }
// It says: "For category X in month Y, I want to spend at most Z"
//
// THE CORE CALCULATION — Spent vs Limit:
// For each budget, we run a SUM of all transactions in that
// category for that month. This is an AGGREGATION query.
//
// SQL equivalent:
//   SELECT SUM(ABS(amount))
//   FROM Transaction
//   WHERE userId = ? AND categoryId = ? AND date BETWEEN ? AND ?
//
// WHY ABS(amount)?
// Expenses are stored as negative numbers (e.g. -500).
// SUM would give -500 + -300 = -800.
// ABS gives us the readable "₹800 spent" figure.
//
// INTERVIEW QUESTION: "How would you optimize this at scale?"
// Answer: Materialized views or a running total column updated
// by a database trigger. Don't recalculate on every page load
// when you have millions of transactions.
// ============================================================

import { prisma } from "@/lib/prisma";

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found. Run: npx tsx prisma/seed.ts");
  return user.id;
}

// ── Get current month string: "2026-07" ─────────────────────
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Get start and end Date objects for a "YYYY-MM" month ────
function getMonthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);         // 1st of month, 00:00:00
  const end   = new Date(year, mon, 0, 23, 59, 59); // Last day of month, 23:59:59
  return { start, end };
}

// ── Get all budgets with spending for current month ─────────
export async function getBudgetsWithSpending(month?: string) {
  const userId    = await getDemoUserId();
  const targetMonth = month ?? getCurrentMonth();
  const { start, end } = getMonthRange(targetMonth);

  // Fetch budgets with their linked category
  const budgets = await prisma.budget.findMany({
    where: { userId, month: targetMonth },
    include: {
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: { category: { name: "asc" } },
  });

  // For each budget, calculate how much was spent this month
  // We run these aggregations in parallel (Promise.all)
  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const result = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          date: { gte: start, lte: end },
          amount: { lt: 0 }, // only expenses (negative amounts)
        },
        _sum: { amount: true },
      });

      const spent = Math.abs(result._sum.amount ?? 0);
      const limit = budget.monthlyLimit;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const remaining = Math.max(0, limit - spent);
      const overBudget = spent > limit;
      const projectedMonthEnd = projectEndOfMonth(spent, start);

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        limit,
        spent,
        remaining,
        percentage,
        overBudget,
        projectedMonthEnd,
        month: targetMonth,
      };
    })
  );

  return budgetsWithSpending;
}

// ── Project end-of-month spend based on daily burn rate ─────
// "If I keep spending at today's daily rate, I'll spend X by month end"
// This is your "I wrote an algorithm" talking point!
function projectEndOfMonth(spentSoFar: number, monthStart: Date): number {
  const today = new Date();
  const daysElapsed = Math.max(
    1,
    Math.floor((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24))
  );
  const totalDaysInMonth = new Date(
    today.getFullYear(), today.getMonth() + 1, 0
  ).getDate();

  const dailyBurnRate = spentSoFar / daysElapsed;
  return Math.round(dailyBurnRate * totalDaysInMonth);
}

// ── Summary: total budgeted vs total spent ──────────────────
export async function getBudgetSummary(month?: string) {
  const budgets = await getBudgetsWithSpending(month);
  const totalLimit   = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent   = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgets.filter((b) => b.overBudget).length;

  return {
    totalLimit,
    totalSpent,
    totalRemaining: Math.max(0, totalLimit - totalSpent),
    overBudgetCount,
    budgetCount: budgets.length,
    utilizationPercent: totalLimit > 0
      ? Math.round((totalSpent / totalLimit) * 100)
      : 0,
  };
}

// ── Get all categories (for "add budget" form) ──────────────
export async function getCategoriesForBudget() {
  return prisma.category.findMany({
    where: { type: "EXPENSE" }, // budgets only for expense categories
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
