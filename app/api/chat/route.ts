// app/api/chat/route.ts
// ============================================================
// STREAMING CHAT API ROUTE — Vercel AI SDK v4 + Gemini + RAG
// ============================================================
//
// WHY AN API ROUTE AND NOT A SERVER ACTION?
// Server Actions don't support streaming responses — they return
// a complete value when done. For chat, we want to stream tokens
// as they're generated so the UI updates in real-time.
// API Routes with the AI SDK handle SSE (Server-Sent Events).
//
// THE FLOW FOR EACH REQUEST:
//   1. Clerk verifies auth from the request headers
//   2. Get last user message from messages array
//   3. embedText(query) → 768-dim vector
//   4. pgvector retrieves 20 most relevant transactions
//   5. Build SYSTEM PROMPT with transaction context (RAG)
//   6. streamText() calls Gemini and streams tokens back
//   7. toDataStreamResponse() formats as SSE for useChat()
// ============================================================

import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { retrieveRelevantTransactions, formatTransactionsAsContext } from "@/lib/ai/rag";
import { getBudgetSummary } from "@/lib/data/budgets";
import { getGoalsSummary } from "@/lib/data/goals";

export const runtime = "nodejs"; // pgvector needs Node.js, not Edge

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function GET() {
  return Response.json({ error: "Use POST" }, { status: 405 });
}

export async function POST(req: Request) {
  // ── Step 1: Verify auth ───────────────────────────────────
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Step 2: Get demo user ─────────────────────────────────
  const user = await prisma.user.findFirst({
    where: { email: "test@financecopilot.dev" },
    select: { id: true },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // ── Step 3: Parse messages ────────────────────────────────
  const { messages } = await req.json() as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const lastUserMessage = messages.findLast((m) => m.role === "user")?.content ?? "";

  // ── Step 4: RAG — semantic retrieval ─────────────────────
  let transactionContext = "No relevant transactions found.";
  try {
    const relevantTxs = await retrieveRelevantTransactions(lastUserMessage, user.id, 20);
    transactionContext = formatTransactionsAsContext(relevantTxs);
  } catch {
    // Fallback gracefully if embeddings not generated yet
    transactionContext = "Transaction context unavailable (run /api/backfill to generate embeddings).";
  }

  // ── Step 5: Financial summary for additional context ──────
  let financialSummary = "";
  try {
    const [budgetResult, goalsResult] = await Promise.allSettled([
      getBudgetSummary(),
      getGoalsSummary(),
    ]);
    if (budgetResult.status === "fulfilled") {
      const b = budgetResult.value;
      financialSummary += `\nBudgets: ₹${b.totalSpent.toFixed(0)} spent of ₹${b.totalLimit.toFixed(0)} (${b.utilizationPercent}% used, ${b.overBudgetCount} categories over limit).`;
    }
    if (goalsResult.status === "fulfilled") {
      const g = goalsResult.value;
      financialSummary += `\nGoals: ${g.completed}/${g.total} complete. Saved ₹${g.totalSaved.toFixed(0)} of ₹${g.totalTargetAmount.toFixed(0)} total target.`;
    }
  } catch { /* non-fatal */ }

  // ── Step 6: System prompt ─────────────────────────────────
  const systemPrompt = `You are Finpilot — a personal finance AI copilot. Give specific, honest, actionable advice based on the user's ACTUAL transaction data below.

RULES:
- Reference specific transactions, amounts, and dates from the context.
- Never give generic advice if you have real data to work with.
- Be concise. Use numbers. Format currency as ₹ (Indian Rupees).
- Keep responses under 200 words unless asked for a detailed breakdown.
- If unsure, say so — don't hallucinate numbers.

USER'S FINANCIAL SUMMARY:${financialSummary || " (Not available)"}

RELEVANT TRANSACTIONS (retrieved via semantic similarity search):
${transactionContext}

Be like a sharp CA friend — honest, specific, no fluff.`;

  // ── Step 7: Stream from Gemini ────────────────────────────
  // IMPORTANT: streamText() is NOT async in AI SDK v4 — do NOT await it.
  // Awaiting it would buffer the ENTIRE response before sending the first byte,
  // turning a 200ms first-token into a 20s blank screen.
  // Without await, it returns a StreamTextResult immediately and the
  // toDataStreamResponse() pipes tokens to the client as they're generated.
  const result = streamText({
    model: google("gemini-3.5-flash"),
    system: systemPrompt,
    messages,
    temperature: 0.3,
    maxTokens: 500,
  });

  // SSE stream — useChat() on the client reads token-by-token
  return result.toDataStreamResponse();
}
