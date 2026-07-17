// app/api/backfill/route.ts
// ============================================================
// ONE-TIME BACKFILL ROUTE — Generate embeddings for all transactions
// ============================================================
// Hit GET /api/backfill to embed every transaction that doesn't
// have a vector yet. Safe to run multiple times (skips already-embedded).
//
// WHY A SEPARATE ROUTE?
// Embedding is expensive (~50ms per transaction, API call to Gemini).
// We don't do it at seed time because the Gemini API key might not
// be set up yet. This route lets you trigger it manually once ready.
//
// PROMISE.ALLSETTLED vs PROMISE.ALL (your earlier point):
// We use allSettled so one failed embedding doesn't abort the rest.
// If Gemini rate-limits on transaction 47, transactions 1-46 and
// 48-100 still get embedded. With Promise.all, everything fails.
// ============================================================

import { auth } from "@clerk/nextjs/server";
import { backfillEmbeddings } from "@/lib/ai/rag";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Protect the route — must be authenticated
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Make sure GEMINI_API_KEY is set
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return Response.json(
      { error: "GEMINI_API_KEY not set. Add it to your .env file." },
      { status: 500 }
    );
  }

  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });

  if (!user) {
    return Response.json({ error: "Demo user not found" }, { status: 404 });
  }

  // Count how many need embedding before starting
  const pendingCount = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::int as count FROM "Transaction"
    WHERE "userId" = ${user.id} AND embedding IS NULL
  `;

  const total = Number(pendingCount[0]?.count ?? 0);

  if (total === 0) {
    return Response.json({ message: "All transactions already have embeddings!", success: 0, failed: 0 });
  }

  // Run the backfill — may take 30-60 seconds for large datasets
  const { success, failed } = await backfillEmbeddings(user.id);

  return Response.json({
    message: `Backfill complete. ${success} embedded, ${failed} failed.`,
    total,
    success,
    failed,
  });
}
