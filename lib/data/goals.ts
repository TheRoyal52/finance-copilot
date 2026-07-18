// lib/data/goals.ts — fixed field names to match actual Prisma schema
// Goal model has: deadline (not targetDate), no description field
//
// CACHING STRATEGY:
// getGoals()        → unstable_cache (60s TTL) — tag: goals-data
// getGoalsSummary() → calls getGoals(), gets cache automatically

import { prisma } from "@/lib/prisma";
import { cache } from "react";
import { unstable_cache } from "next/cache";

// React cache() — deduplicates within one server request only
const getDemoUserId = cache(async (): Promise<string> => {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found.");
  return user.id;
});

// ── Raw goals query (the real DB work) ──────────────────────────────────────
async function fetchGoals() {
  const userId = await getDemoUserId();

  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: "asc" }, // soonest deadline first
  });

  const today = new Date();

  return goals.map((goal) => {
    const percentage = goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

    const remaining  = Math.max(0, goal.targetAmount - goal.currentAmount);
    const isComplete = goal.currentAmount >= goal.targetAmount;

    let daysLeft: number | null = null;
    let dailyNeeded: number | null = null;

    if (goal.deadline) {
      daysLeft = Math.max(
        0,
        Math.ceil((goal.deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );
      if (daysLeft > 0 && !isComplete) {
        dailyNeeded = Math.ceil(remaining / daysLeft);
      }
    }

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining,
      percentage,
      isComplete,
      deadline: goal.deadline,
      daysLeft,
      dailyNeeded,
    };
  });
}

// Cached version — 60s TTL, invalidated by revalidateTag("goals-data")
export const getGoals = unstable_cache(
  fetchGoals,
  ["goals"],
  { revalidate: 60, tags: ["goals-data"] }
);

export async function getGoalsSummary() {
  const goals = await getGoals();
  return {
    total: goals.length,
    completed: goals.filter((g) => g.isComplete).length,
    inProgress: goals.filter((g) => !g.isComplete).length,
    totalTargetAmount: goals.reduce((s, g) => s + g.targetAmount, 0),
    totalSaved: goals.reduce((s, g) => s + g.currentAmount, 0),
  };
}
