// lib/ai/embed.ts
// ============================================================
// EMBEDDING PIPELINE — using @ai-sdk/google (NOT @google/generative-ai)
// ============================================================
//
// WHY WE SWITCHED FROM @google/generative-ai TO @ai-sdk/google:
// The @google/generative-ai SDK calls the v1beta endpoint:
//   https://generativelanguage.googleapis.com/v1beta/models/...
//
// But text-embedding-004 is only available on v1:
//   https://generativelanguage.googleapis.com/v1/models/text-embedding-004
//
// @ai-sdk/google (Vercel AI SDK) calls the correct v1 endpoint
// AND we already have it installed for the /api/chat route.
// Using one library for both chat + embeddings keeps things consistent.
//
// EMBEDDING DIMENSIONS: text-embedding-004 → 768 floats
// Each float captures a different "semantic dimension" of the text.
// Similar meanings → close in 768-D space → small cosine distance (<=>) in pgvector.
//
// INTERVIEW ANSWER:
// "We embed transaction descriptions using Google's text-embedding-004 model
//  via the Vercel AI SDK. The SDK abstracts the v1 vs v1beta distinction and
//  gives us a consistent interface that works with both embeddings and streaming chat."
// ============================================================

import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// IMPORTANT: @ai-sdk/google's default `google` export reads GOOGLE_GENERATIVE_AI_API_KEY.
// Our env var is GEMINI_API_KEY, so we must create a custom instance with the key.
// This matches what /api/chat/route.ts already does for chat.
const googleAI = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// text-embedding-004: 768-dimensional, available on v1 endpoint (not v1beta)
const embeddingModel = googleAI.textEmbeddingModel("text-embedding-004");

export async function embedText(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

// Convert a number[] to Postgres vector literal: "[0.1,0.2,...]"
// pgvector requires this exact format for INSERT/UPDATE via raw SQL
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

// Build a rich descriptive text string for a transaction
// Better context → better embedding → better semantic search results
// We include: type (expense/income), description, category, and amount
// so the AI knows both WHAT was spent and HOW MUCH
export function buildTransactionText(
  description: string,
  category: string,
  amount: number
): string {
  const type   = amount < 0 ? "expense" : "income";
  const absAmt = Math.abs(amount);
  return `${type}: ${description} (${category}, ₹${absAmt.toFixed(0)})`;
}
