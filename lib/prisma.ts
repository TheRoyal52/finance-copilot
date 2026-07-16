// lib/prisma.ts
// =====================================================
// PRISMA SINGLETON with Neon Driver Adapter (Prisma v7)
// =====================================================
// Prisma v7 requires an explicit driver adapter for serverless
// databases like Neon. Neon uses HTTP/WebSockets instead of
// persistent TCP connections — the adapter bridges this gap.
// =====================================================

import { PrismaClient } from "@/app/generated/prisma";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

// Required for Neon WebSocket connections in Node.js environment
// (In browser/edge environments, native WebSocket is used instead)
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    // "query" log prints every SQL query in dev — great for learning
    // what Prisma actually does under the hood
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
