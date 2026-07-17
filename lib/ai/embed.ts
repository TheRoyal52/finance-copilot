// lib/ai/embed.ts
// ============================================================
// EMBEDDING PIPELINE
// ============================================================
//
// WHAT IS AN EMBEDDING?
// A list of numbers (vector) that represents the "meaning" of text.
// The Gemini embedding model converts text into 768 floats.
//
// WHY 768 NUMBERS?
// Each number represents a dimension in "semantic space".
// Words/phrases with similar meaning cluster together in this space.
// "Zomato order" and "Swiggy delivery" → very close vectors
// "Netflix subscription" and "salary credit" → far apart vectors
//
// COSINE SIMILARITY:
// Two vectors are "similar" if the angle between them is small.
// cos(0°) = 1.0 (identical direction = same meaning)
// cos(90°) = 0.0 (perpendicular = unrelated)
// cos(180°) = -1.0 (opposite direction = opposite meaning)
//
// In pgvector: <=> operator computes cosine DISTANCE (1 - similarity)
// So smaller <=> = more similar
//
// INTERVIEW: "How does your RAG know which transactions are relevant?"
// "We embed both the user's question and every transaction description
//  using the same model. Then we find the transactions whose embeddings
//  are closest to the query embedding using cosine distance in pgvector."
// ============================================================

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// text-embedding-004 is Google's latest embedding model
// Produces 768-dimensional vectors
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Generate a single embedding vector for a piece of text
// Returns: number[] of length 768
export async function embedText(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}

// Convert a number[] to Postgres vector literal: "[0.1,0.2,...]"
// pgvector requires this exact format for INSERT/UPDATE
export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

// Build a descriptive text string for a transaction that captures context
// Better context → better embedding → better search results
// Include category and sign so AI knows income vs expense
export function buildTransactionText(
  description: string,
  category: string,
  amount: number
): string {
  const type    = amount < 0 ? "expense" : "income";
  const absAmt  = Math.abs(amount);
  return `${type}: ${description} (${category}, ₹${absAmt.toFixed(0)})`;
}
