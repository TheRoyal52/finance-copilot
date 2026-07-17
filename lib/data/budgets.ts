// lib/data/budgets.ts — FIXED: month is DateTime, stored as first day of month
// ============================================================
// WHY DID THIS BREAK?
// The Prisma schema has: month DateTime
// This means Prisma expects a full Date object, NOT a string like "2026-07"
// Solution: store + query using the first day of the month (e.g. 2026-07-01)
//
// UNIQUE CONSTRAINT FIX:
// @@unique([userId, categoryId, month])
// Prisma generates: userId_categoryId_month as the constraint name
// For upsert, we must pass { userId_categoryId_month: { userId, categoryId, month } }
// AND month must be a DateTime (Date object), not a string
// ============================================================

import { prisma } from "@/lib/prisma";

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found.");
  return user.id;
}

// Returns the first day of the current month as a Date object
// e.g. July 2026 → new Date(2026, 6, 1) which is 2026-07-01T00:00:00.000Z
function getFirstDayOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// Label for display: "July 2026"
export function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

// Get start + end of a month from a Date object
function getMonthRange(firstDay: Date): { start: Date; end: Date } {
  const start = new Date(firstDay);
  start.setHours(0, 0, 0, 0);

  const end = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ── Get budgets with actual spending for the current month ──
export async function getBudgetsWithSpending(monthDate?: Date) {
  const userId = await getDemoUserId();
  const firstDay = monthDate ?? getFirstDayOfCurrentMonth();
  const { start, end } = getMonthRange(firstDay);

  const budgets = await prisma.budget.findMany({
    where: { userId, month: firstDay },
    include: {
      category: { select: { id: true, name: true, type: true } },
    },
    orderBy: { category: { name: "asc" } },
  });

  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const result = await prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          date: { gte: start, lte: end },
          amount: { lt: 0 },
        },
        _sum: { amount: true },
      });

      const spent      = Math.abs(result._sum.amount ?? 0);
      const limit      = budget.monthlyLimit;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const remaining  = Math.max(0, limit - spent);
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
        month: firstDay,  // Date object — first day of the month
      };
    })
  );

  return budgetsWithSpending;
}

// Project spending for rest of month based on daily burn rate
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

export async function getBudgetSummary(monthDate?: Date) {
  const budgets = await getBudgetsWithSpending(monthDate);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return {
    totalLimit,
    totalSpent,
    totalRemaining: Math.max(0, totalLimit - totalSpent),
    overBudgetCount: budgets.filter((b) => b.overBudget).length,
    budgetCount: budgets.length,
    utilizationPercent: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
  };
}

export async function getCategoriesForBudget() {
  return prisma.category.findMany({
    where: { type: "EXPENSE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
