// app/api/backfill/route.ts
// ============================================================
// ONE-TIME BACKFILL ROUTE — Generate embeddings for all transactions
// ============================================================
// Hit GET /api/backfill to embed every transaction that doesn't
// have a vector yet. Safe to run multiple times (skips already-embedded).
// ============================================================

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { embedText, buildTransactionText, toVectorLiteral } from "@/lib/ai/embed";

export async function GET() {
  // Protect the route — must be authenticated
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 1: Validate API key exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "") {
    return Response.json(
      {
        error: "GEMINI_API_KEY not set.",
        fix: "1. Get key from https://aistudio.google.com/apikey  2. Add GEMINI_API_KEY=AIza... to your .env file  3. Restart the dev server  4. Hit this route again"
      },
      { status: 500 }
    );
  }

  // Step 2: Test the key with a single embedding call BEFORE processing all transactions
  try {
    await embedText("test connection");
  } catch (testErr: unknown) {
    const msg = testErr instanceof Error ? testErr.message : String(testErr);
    return Response.json(
      {
        error: "Gemini API key validation failed.",
        details: msg,
        fix: "Check your GEMINI_API_KEY in .env — it should start with 'AIza'"
      },
      { status: 500 }
    );
  }

  // Step 3: Get demo user
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "Demo user not found" }, { status: 404 });
  }

  // Step 4: Get transactions needing embeddings
  const transactions = await prisma.$queryRaw<
    { id: string; description: string; amount: number; categoryName: string }[]
  >`
    SELECT t.id, t.description, t.amount, c.name AS "categoryName"
    FROM "Transaction" t
    JOIN "Category" c ON t."categoryId" = c.id
    WHERE t."userId" = ${user.id}
      AND t.embedding IS NULL
  `;

  if (transactions.length === 0) {
    return Response.json({
      message: "All transactions already have embeddings! The AI copilot is ready.",
      success: 0,
      failed: 0,
      tip: "Click the ⬡ button on any page to chat with Finpilot."
    });
  }

  // Step 5: Embed and save — one at a time to avoid rate limits
  // Promise.allSettled = all run even if some fail; we log each error
  let success = 0;
  const errors: string[] = [];

  for (const tx of transactions) {
    try {
      const text      = buildTransactionText(tx.description, tx.categoryName, tx.amount);
      const embedding = await embedText(text);
      const vector    = toVectorLiteral(embedding);

      // $executeRawUnsafe needed — Prisma.sql breaks ::vector cast
      await prisma.$executeRawUnsafe(
        `UPDATE "Transaction" SET embedding = $1::vector WHERE id = $2`,
        vector,
        tx.id
      );
      success++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`[${tx.id}] ${tx.description}: ${msg}`);
    }
  }

  return Response.json({
    message: `Backfill complete. ${success} embedded, ${errors.length} failed.`,
    total: transactions.length,
    success,
    failed: errors.length,
    // Show first 3 errors to help debug
    errors: errors.slice(0, 3),
    tip: success > 0 ? "Click the ⬡ button to chat with Finpilot!" : "Check the errors array above to diagnose failures."
  });
}
