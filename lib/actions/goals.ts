"use server";
// lib/actions/goals.ts — fixed to match actual Goal schema
// Fields: name, targetAmount, currentAmount, deadline (not targetDate), no description

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

export async function createGoal(formData: FormData): Promise<{ error?: string }> {
  const name       = (formData.get("name") as string)?.trim();
  const rawTarget  = formData.get("targetAmount") as string;
  const rawCurrent = formData.get("currentAmount") as string;
  const rawDate    = formData.get("targetDate") as string;

  if (!name || !rawTarget) return { error: "Name and target amount are required." };

  const targetAmount  = parseFloat(rawTarget);
  const currentAmount = parseFloat(rawCurrent || "0");

  if (isNaN(targetAmount) || targetAmount <= 0) return { error: "Target amount must be positive." };
  if (isNaN(currentAmount) || currentAmount < 0) return { error: "Current amount cannot be negative." };
  if (currentAmount > targetAmount) return { error: "Current amount cannot exceed target." };

  const deadline = rawDate ? new Date(rawDate) : null;
  const userId   = await getDemoUserId();

  try {
    await prisma.goal.create({
      data: { userId, name, targetAmount, currentAmount, deadline },
    });
    revalidateTag("goals-data", "max");
    revalidatePath("/goals");
    return {};
  } catch (err) {
    console.error("createGoal error:", err);
    return { error: "Failed to create goal." };
  }
}

export async function addSavingsToGoal(
  goalId: string,
  amount: number
): Promise<{ error?: string }> {
  if (!goalId || isNaN(amount) || amount <= 0) return { error: "Invalid input." };

  const userId = await getDemoUserId();

  try {
    const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!goal) return { error: "Goal not found." };

    const newAmount = Math.min(goal.targetAmount, goal.currentAmount + amount);
    await prisma.goal.update({
      where: { id: goalId },
      data: { currentAmount: newAmount },
    });

    revalidateTag("goals-data", "max");
    revalidatePath("/goals");
    return {};
  } catch (err) {
    console.error("addSavingsToGoal error:", err);
    return { error: "Failed to update savings." };
  }
}

export async function deleteGoal(id: string): Promise<{ error?: string }> {
  const userId = await getDemoUserId();

  try {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) return { error: "Goal not found or access denied." };

    await prisma.goal.delete({ where: { id } });
    revalidateTag("goals-data", "max");
    revalidatePath("/goals");
    return {};
  } catch (err) {
    console.error("deleteGoal error:", err);
    return { error: "Failed to delete goal." };
  }
}
