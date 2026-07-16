// lib/types.ts
// ============================================================
// SHARED TYPESCRIPT TYPES — Single source of truth
// ============================================================
//
// WHY A SEPARATE TYPES FILE?
// Prisma generates its own types, but they're complex generics.
// For example, a transaction with its category join looks like:
//   Prisma.TransactionGetPayload<{ include: { category: true } }>
// That's hard to remember and repeat across files.
//
// We define simple, readable aliases here and import them
// wherever needed. One change here → updates everywhere.
//
// INTERVIEW TIP:
// In real codebases, this pattern is called "domain types" or
// "application types." They sit between the raw database types
// (Prisma) and the UI components. Benefits:
// 1. Decoupled — UI doesn't depend directly on Prisma types
// 2. If you switch ORMs, only this file needs updating
// 3. Easier to add computed fields (e.g., formatted amounts)
// ============================================================

// ── Transaction ──────────────────────────────────────────────
export interface TransactionCategory {
  name: string;
  type: string;  // "INCOME" | "EXPENSE"
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  userId: string;
  categoryId: number | null;
  category: TransactionCategory | null;
}

// ── Category ─────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  type: string;
  icon?: string | null;
}

// ── Budget ───────────────────────────────────────────────────
export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  overBudget: boolean;
}

// ── Goal ─────────────────────────────────────────────────────
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | null;
  percentage: number;
}

// ── Dashboard summary types ───────────────────────────────────
export interface MonthSummary {
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

export interface CashflowMonth {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface CategorySpend {
  name: string;
  amount: number;
  percentage: number;
}

// ── Pagination ───────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}
