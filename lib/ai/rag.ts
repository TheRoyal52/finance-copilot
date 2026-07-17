// lib/ai/rag.ts
// ============================================================
// RAG PIPELINE — Retrieval-Augmented Generation
// ============================================================
//
// THE RAG FLOW:
//   1. User asks: "Why am I overspending on food?"
//   2. embedText(query) → [0.23, -0.41, 0.88, ...] (768 numbers)
//   3. pgvector finds the 20 transactions closest to this vector
//   4. We format those transactions as context
//   5. LLM receives: context + question → grounded answer
//
// WHY NOT JUST GIVE THE LLM ALL TRANSACTIONS?
//   GPT-4 / Gemini context window ≈ 128k tokens
//   But: 1 transaction ≈ 20 tokens → 128k / 20 = 6,400 transactions max
//   Cost: $0.01 per 1k tokens → sending 500 transactions = $0.10 PER QUERY
//   RAG: we send only the 20 MOST RELEVANT → 20x cheaper + more focused
//
// THE <=> OPERATOR:
//   This is pgvector's cosine distance operator.
//   It finds vectors pointing in the same "semantic direction".
//   We use Prisma.$queryRaw because Prisma doesn't support custom operators.
//   Prisma.sql`` is a tagged template that prevents SQL injection.
// ============================================================

import { prisma } from "@/lib/prisma";
import { embedText, toVectorLiteral, buildTransactionText } from "./embed";
import { Prisma } from "@/app/generated/prisma";

interface TransactionContext {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  similarity: number;
}

// Find the N most semantically similar transactions to a query
export async function retrieveRelevantTransactions(
  query: string,
  userId: string,
  limit = 20
): Promise<TransactionContext[]> {
  // Step 1: Embed the query
  const queryEmbedding = await embedText(query);
  const vectorLiteral  = toVectorLiteral(queryEmbedding);

  // Step 2: Cosine distance search via pgvector
  // <=> = cosine distance (lower = more similar)
  // 1 - (embedding <=> query) = cosine similarity (higher = more similar)
  // We ORDER BY distance ASC to get most similar first
  const results = await prisma.$queryRaw<TransactionContext[]>(
    Prisma.sql`
      SELECT
        t.id,
        t.description,
        t.amount,
        t.date,
        c.name AS category,
        1 - (t.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "Transaction" t
      JOIN "Category" c ON t."categoryId" = c.id
      WHERE t."userId" = ${userId}
        AND t.embedding IS NOT NULL
      ORDER BY t.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `
  );

  return results;
}

// Format retrieved transactions as a readable context string for the LLM
// This becomes part of the system prompt
export function formatTransactionsAsContext(
  transactions: TransactionContext[]
): string {
  if (transactions.length === 0) {
    return "No transaction data available yet.";
  }

  const lines = transactions.map((t) => {
    const type   = t.amount < 0 ? "Expense" : "Income";
    const amount = `₹${Math.abs(t.amount).toFixed(0)}`;
    const date   = new Date(t.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `- ${type}: ${t.description} (${t.category}) — ${amount} on ${date}`;
  });

  return lines.join("\n");
}

// Embed ALL existing transactions that don't have an embedding yet
// Called once to backfill historical data
// Uses Promise.allSettled so one failure doesn't block the rest
export async function backfillEmbeddings(userId: string): Promise<{
  success: number;
  failed: number;
}> {
  const transactions = await prisma.$queryRaw<
    { id: string; description: string; amount: number; categoryName: string }[]
  >(
    Prisma.sql`
      SELECT t.id, t.description, t.amount, c.name AS "categoryName"
      FROM "Transaction" t
      JOIN "Category" c ON t."categoryId" = c.id
      WHERE t."userId" = ${userId}
        AND t.embedding IS NULL
    `
  );

  // Promise.allSettled: all run, failures don't block others
  // (your earlier point about Promise.all vs allSettled — this is where it matters!)
  const results = await Promise.allSettled(
    transactions.map(async (tx) => {
      const text      = buildTransactionText(tx.description, tx.categoryName, tx.amount);
      const embedding = await embedText(text);
      const vector    = toVectorLiteral(embedding);

      // WHY $executeRawUnsafe?
      // Prisma.sql`` parameterizes the vector string as a 'text' type,
      // which breaks the ::vector cast silently (the UPDATE runs but stores NULL).
      // $executeRawUnsafe lets us pass the vector literal as a plain string
      // in the SQL, where Postgres correctly casts it to vector(768).
      // This is one of the few valid use-cases for raw unsafe SQL in Prisma.
      await prisma.$executeRawUnsafe(
        `UPDATE "Transaction" SET embedding = $1::vector WHERE id = $2`,
        vector,  // "[0.1, 0.2, ...]" — pgvector text literal format
        tx.id
      );
    })
  );

  const success = results.filter((r) => r.status === "fulfilled").length;
  const failed  = results.filter((r) => r.status === "rejected").length;
  return { success, failed };
}
