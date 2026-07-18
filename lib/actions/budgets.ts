"use server";
// lib/actions/budgets.ts — FIXED: month stored as DateTime (first day of month)

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found.");
  return user.id;
}

function getFirstDayOfCurrentMonth(): Date {
  const now = new Date();
  // Month is 0-indexed: getMonth() returns 6 for July
  // new Date(2026, 6, 1) = 2026-07-01
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function upsertBudget(formData: FormData): Promise<{ error?: string }> {
  const categoryId = formData.get("categoryId") as string;
  const rawLimit   = formData.get("limit") as string;

  if (!categoryId || !rawLimit) return { error: "Category and limit are required." };

  const limit = parseFloat(rawLimit);
  if (isNaN(limit) || limit <= 0) return { error: "Limit must be a positive number." };

  const userId   = await getDemoUserId();
  // Always budget for CURRENT month — store as first day DateTime
  const month    = getFirstDayOfCurrentMonth();

  try {
    // UPSERT: create if not exists, update limit if already set for this month
    // The unique constraint is: userId + categoryId + month (all three together)
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month: { userId, categoryId, month },
      },
      update: { monthlyLimit: limit },
      create: { userId, categoryId, month, monthlyLimit: limit },
    });

    revalidateTag("budgets-data", "max");
    revalidateTag("dashboard-data", "max");
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    console.error("upsertBudget error:", err);
    return { error: "Failed to save budget. Please try again." };
  }
}

export async function deleteBudget(id: string): Promise<{ error?: string }> {
  if (!id) return { error: "Budget ID required." };
  const userId = await getDemoUserId();

  try {
    const budget = await prisma.budget.findFirst({ where: { id, userId } });
    if (!budget) return { error: "Budget not found or access denied." };

    await prisma.budget.delete({ where: { id } });
    revalidateTag("budgets-data", "max");
    revalidateTag("dashboard-data", "max");
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    console.error("deleteBudget error:", err);
    return { error: "Failed to delete budget." };
  }
}
