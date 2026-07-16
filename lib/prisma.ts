// lib/prisma.ts
// ============================================================
// THE PRISMA SINGLETON — one database connection for the whole app
// ============================================================
//
// WHAT IS PRISMA?
// Prisma is an ORM (Object Relational Mapper). An ORM sits between
// your TypeScript code and your database, translating between them:
//
//   Your code:  prisma.transaction.findMany({ where: { userId: "abc" } })
//   Actual SQL: SELECT * FROM "Transaction" WHERE "userId" = 'abc';
//
// WHY AN ORM vs. raw SQL?
// 1. Type safety — if you typo a field, TypeScript catches it
// 2. No SQL injection risk — Prisma parameterizes queries automatically
// 3. Cleaner code — reads like English, not SQL syntax
//
// WHY A SINGLETON PATTERN?
// In Next.js development, every time you save a file, Next.js hot-reloads
// the changed module. Without a singleton:
//   - Save file → new PrismaClient() created → 1 DB connection
//   - Save file again → another new PrismaClient() → 2 connections
//   - Save 50 times → 50 connections → Neon limit hit → app crashes
//
// The singleton stores the client on `globalThis` which survives
// hot-reloads (unlike module-level variables which get recreated).
//
// WHY PrismaNeonHttp?
// Neon is a SERVERLESS PostgreSQL database. "Serverless" means it 
// doesn't maintain persistent TCP connections (the traditional way 
// databases connect). Instead, Neon uses HTTP requests per query.
// PrismaNeonHttp is the adapter that translates Prisma's operations
// into these HTTP requests.
// ============================================================

import { PrismaClient } from "@/app/generated/prisma";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

// Extend globalThis type so TypeScript doesn't complain about
// a property that doesn't exist in the standard type definitions
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // PrismaNeonHttp takes the URL string directly
  // The URL comes from .env → process.env.DATABASE_URL
  // PrismaNeonHttp(connectionString, options) — options is required by TS types
  // but all fields are optional, so {} works fine
  const connectionString = `${process.env.DATABASE_URL}`;
  const adapter = new PrismaNeonHttp(connectionString, {});
  
  return new PrismaClient({
    adapter,
    // In development, log every query Prisma executes
    // This is extremely useful for learning — you see exactly
    // what SQL runs when you call prisma.transaction.findMany()
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });
}

// The ?? operator: "use left side if it exists, otherwise right side"
// globalForPrisma.prisma ?? createPrismaClient() means:
//   "if prisma is already on globalThis, use it (no new connection)"
//   "if it's not there yet, create a new one"
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Only cache in development — production doesn't hot-reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
