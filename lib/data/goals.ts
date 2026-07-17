// lib/data/goals.ts — fixed field names to match actual Prisma schema
// Goal model has: deadline (not targetDate), no description field

import { prisma } from "@/lib/prisma";
import { cache } from "react";

const getDemoUserId = cache(async (): Promise<string> => {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found.");
  return user.id;
});

export async function getGoals() {
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
      deadline: goal.deadline,   // correct field name
      daysLeft,
      dailyNeeded,
    };
  });
}

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
