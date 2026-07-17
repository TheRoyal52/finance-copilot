"use server";
// lib/actions/transactions.ts
// ============================================================
// SERVER ACTIONS — Write operations for transactions
// ============================================================
//
// WHAT IS A SERVER ACTION?
// A Server Action is a function marked "use server" that Next.js
// automatically makes callable from the client. Behind the scenes:
// 1. Next.js creates a hidden POST endpoint for this function
// 2. When the client calls it, it sends a POST request
// 3. The function runs server-side (has DB access, env vars)
// 4. Returns a result to the client
//
// WHY THIS IS BETTER THAN API ROUTES:
// API Route:     create /api/transactions/route.ts
//                write validation logic
//                handle POST/GET/DELETE separately
//                call from client with fetch('/api/transactions', {...})
//
// Server Action: write one function with "use server"
//                call it directly like a regular function
//                TypeScript types flow end-to-end (no JSON.parse)
//                Less code, less surface area for bugs
//
// SECURITY:
// Server Actions are still POST requests under the hood.
// Clerk middleware still runs — unauthenticated requests are
// rejected BEFORE the action ever executes.
// Never trust client-sent userId — always get it from auth().
//
// VALIDATION:
// We do server-side validation even though the form has HTML
// validation (required, min, type). Why?
// Because a user can disable HTML validation by:
//   - Using browser devtools
//   - Sending a direct HTTP request (curl, Postman)
// "Never trust the client" — validate on the server too.
// ============================================================

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { embedText, buildTransactionText, toVectorLiteral } from "@/lib/ai/embed";

// ── Add Transaction ────────────────────────────────────────
// Called from AddTransactionDrawer when the form is submitted
export async function addTransaction(
  formData: FormData
): Promise<{ error?: string; id?: string }> {

  // --- Step 1: Extract raw form data ---
  const rawAmount     = formData.get("amount") as string;
  const description   = formData.get("description") as string;
  const rawCategoryId = formData.get("categoryId") as string;
  const rawDate       = formData.get("date") as string;

  // --- Step 2: Validate (server-side, never trust client) ---
  if (!rawAmount || !description || !rawCategoryId || !rawDate) {
    return { error: "All fields are required." };
  }

  const amount = parseFloat(rawAmount);
  if (isNaN(amount) || amount <= 0) {
    return { error: "Amount must be a positive number." };
  }

  if (description.trim().length < 2) {
    return { error: "Description must be at least 2 characters." };
  }

  // Category id is a String (cuid) — no parseInt needed
  const categoryId = rawCategoryId.trim();
  if (!categoryId) {
    return { error: "Invalid category selected." };
  }

  const date = new Date(rawDate);
  if (isNaN(date.getTime())) {
    return { error: "Invalid date." };
  }

  // --- Step 3: Get category to determine if income or expense ---
  // Expenses are stored as NEGATIVE numbers (so SUM gives correct balance)
  // Income is stored as POSITIVE
  // This is a common accounting convention: debits are negative
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { type: true },
  });

  if (!category) {
    return { error: "Category not found." };
  }

  // Expenses stored as negative, income as positive
  const signedAmount = category.type === "EXPENSE" ? -Math.abs(amount) : Math.abs(amount);

  // --- Step 4: Get the demo user ---
  // TODO Sprint 3: Replace with auth().userId from Clerk
  // const { userId } = await auth(); — get actual authenticated user
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });

  if (!user) {
    return { error: "User session not found. Please refresh." };
  }

  // --- Step 5: Write to database ---
  try {
    const transaction = await prisma.transaction.create({
      data: {
        amount: signedAmount,
        description: description.trim(),
        date,
        categoryId,
        userId: user.id,
        // embedding: null — will be generated in Sprint 7 (RAG)
        // When RAG is ready: embedding = await generateEmbedding(description)
      },
    });

    // --- Step 6: Auto-embed the new transaction for RAG (fire-and-forget) ---
    // We don't await this — embedding is non-critical.
    // If Gemini is down or the key is missing, the transaction is still saved.
    // The backfill route can embed it later.
    // "Fire-and-forget" pattern: start the async work, don't block the response.
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      // Fetch category name for richer embedding context
      const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { name: true } });
      const text   = buildTransactionText(description.trim(), cat?.name ?? "Unknown", signedAmount);
      embedText(text)
        .then((embedding) => {
          const vector = toVectorLiteral(embedding);
          // $executeRawUnsafe needed — Prisma.sql breaks the ::vector cast
          return prisma.$executeRawUnsafe(
            `UPDATE "Transaction" SET embedding = $1::vector WHERE id = $2`,
            vector,
            transaction.id
          );
        })
        .catch((err) => console.warn("Embedding failed for", transaction.id, err));
    }

    // --- Step 7: Revalidate pages ---
    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return { id: transaction.id };

  } catch (err) {
    console.error("addTransaction error:", err);
    return { error: "Failed to save transaction. Please try again." };
  }
}

// ── Delete Transaction ──────────────────────────────────────
export async function deleteTransaction(
  id: string
): Promise<{ error?: string }> {

  if (!id) return { error: "Transaction ID required." };

  try {
    // Verify this transaction belongs to the demo user before deleting
    // (authorization check — not just authentication!)
    const user = await prisma.user.findFirst({
      where: { email: "test@financecopilot.dev" },
      select: { id: true },
    });

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: user?.id },
    });

    if (!transaction) {
      return { error: "Transaction not found or access denied." };
    }

    await prisma.transaction.delete({ where: { id } });

    revalidatePath("/transactions");
    revalidatePath("/dashboard");

    return {};

  } catch (err) {
    console.error("deleteTransaction error:", err);
    return { error: "Failed to delete transaction." };
  }
}
