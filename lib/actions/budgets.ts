"use server";
// lib/actions/budgets.ts — Server Actions for budget CRUD

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function getDemoUserId(): Promise<string> {
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) throw new Error("Demo user not found.");
  return user.id;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ── Create or Update Budget ────────────────────────────────
// "Upsert" = update if exists, insert if not
// Prisma supports this natively with upsert()
// WHY UPSERT instead of separate create/update?
// A user might click "Set Budget" for Food multiple times.
// Instead of throwing an error ("budget already exists"),
// we just update the limit. One action covers both cases.
export async function upsertBudget(
  formData: FormData
): Promise<{ error?: string }> {
  const categoryId  = formData.get("categoryId") as string;
  const rawLimit    = formData.get("limit") as string;
  const month       = (formData.get("month") as string) || getCurrentMonth();

  if (!categoryId || !rawLimit) {
    return { error: "Category and limit are required." };
  }

  const limit = parseFloat(rawLimit);
  if (isNaN(limit) || limit <= 0) {
    return { error: "Limit must be a positive number." };
  }

  const userId = await getDemoUserId();

  try {
    await prisma.budget.upsert({
      where: {
        // Unique constraint: one budget per user per category per month
        userId_categoryId_month: { userId, categoryId, month },
      },
      update: { monthlyLimit: limit },
      create: { userId, categoryId, month, monthlyLimit: limit },
    });

    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    console.error("upsertBudget error:", err);
    return { error: "Failed to save budget. Please try again." };
  }
}

// ── Delete Budget ──────────────────────────────────────────
export async function deleteBudget(
  id: string
): Promise<{ error?: string }> {
  if (!id) return { error: "Budget ID required." };

  const userId = await getDemoUserId();

  try {
    // Authorization check first — ensure this budget belongs to this user
    const budget = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!budget) {
      return { error: "Budget not found or access denied." };
    }

    await prisma.budget.delete({ where: { id } });
    revalidatePath("/budgets");
    revalidatePath("/dashboard");
    return {};
  } catch (err) {
    console.error("deleteBudget error:", err);
    return { error: "Failed to delete budget." };
  }
}
